function processData(edges) {
    const validEdges = new Set();
    const duplicateEdges = new Set();
    const invalidEntries = [];

    const graph = {};
    const inDegree = {};
    const childHasParent = new Set();

    // STEP 1: validation + duplicates + multi-parent
    for (let raw of edges) {
        let str = raw.trim();

        if (!/^[A-Z]->[A-Z]$/.test(str) || str[0] === str[3]) {
            invalidEntries.push(raw);
            continue;
        }

        if (validEdges.has(str)) {
            duplicateEdges.add(str);
            continue;
        }

        const [u, v] = str.split("->");

        if (childHasParent.has(v)) continue;

        validEdges.add(str);
        childHasParent.add(v);

        if (!graph[u]) graph[u] = [];
        graph[u].push(v);

        inDegree[v] = (inDegree[v] || 0) + 1;
        if (!(u in inDegree)) inDegree[u] = 0;
    }

    const nodes = Object.keys(inDegree);
    const visitedGlobal = new Set();

    const hierarchies = [];
    let totalTrees = 0;
    let totalCycles = 0;
    let maxDepth = 0;
    let largestRoot = "";

    // detect cycle using DFS coloring
    function hasCycle(node, visiting, visited) {
        if (visiting.has(node)) return true;
        if (visited.has(node)) return false;

        visiting.add(node);

        for (let child of (graph[node] || [])) {
            if (hasCycle(child, visiting, visited)) return true;
        }

        visiting.delete(node);
        visited.add(node);
        return false;
    }

    function buildTree(node) {
        let subtree = {};
        for (let child of (graph[node] || [])) {
            subtree[child] = buildTree(child);
        }
        return subtree;
    }

    function getDepth(tree) {
        if (!tree || Object.keys(tree).length === 0) return 1;
        return 1 + Math.max(...Object.values(tree).map(getDepth));
    }

    // STEP 2: process components
    for (let node of nodes) {
        if (visitedGlobal.has(node)) continue;

        const component = new Set();
        const stack = [node];

        while (stack.length) {
            const curr = stack.pop();
            if (component.has(curr)) continue;
            component.add(curr);

            for (let child of (graph[curr] || [])) stack.push(child);
            for (let parent in graph) {
                if (graph[parent].includes(curr)) stack.push(parent);
            }
        }

        component.forEach(n => visitedGlobal.add(n));

        const compNodes = Array.from(component);

        // check cycle
        let cycleFound = false;
        const visiting = new Set();
        const visited = new Set();

        for (let n of compNodes) {
            if (hasCycle(n, visiting, visited)) {
                cycleFound = true;
                break;
            }
        }

        let root;
        const rootCandidates = compNodes.filter(n => inDegree[n] === 0);

        if (rootCandidates.length > 0) {
            root = rootCandidates.sort()[0];
        } else {
            root = compNodes.sort()[0];
        }

        if (cycleFound) {
            totalCycles++;
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            totalTrees++;

            const tree = { [root]: buildTree(root) };
            const depth = getDepth(tree[root]);

            if (
                depth > maxDepth ||
                (depth === maxDepth && (largestRoot === "" || root < largestRoot))
            ) {
                maxDepth = depth;
                largestRoot = root;
            }

            hierarchies.push({
                root,
                tree,
                depth
            });
        }
    }

    return {
        hierarchies,
        invalid_entries: invalidEntries,
        duplicate_edges: Array.from(duplicateEdges),
        summary: {
            total_trees: totalTrees,
            total_cycles: totalCycles,
            largest_tree_root: largestRoot
        }
    };
}

module.exports = { processData };