function initializeGraph() {
}

function addNewNode(nodeName, nodeType, nodeIp, nodeMac) {
  var newNode = new Node(nodeName, nodeType, nodeIp, nodeMac);
  nodes.add(newNode);
}
