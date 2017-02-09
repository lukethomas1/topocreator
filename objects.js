class Edge {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}

class GraphData {
  constructor(nodes, edges, containerId) {
    this.nodes = nodes;
    this.edges = edges;
    this.containerId = containerId;
    this.network = null;
    this.options = {
      interaction:{
        dragNodes:true,
        dragView: true,
        hover: true,
        multiselect: true,
        navigationButtons: true,
        selectable: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
        zoomView: true
      },
      manipulation:{
        enabled: true,
        initiallyActive: true,
        addNode: true,
        addEdge: true,
        editEdge: true,
        deleteNode: true,
        deleteEdge: true,
      }
    }
  }

  addEdge(edge) {
    this.edges.add(edge);
  }

  addNode(node) {
    this.nodes.update(node);
  }

  connectNodeToSubnet(nodeName, subnetName) {
    var newNode = this.nodes.get(nodeName);
    newNode.group = subnetName;
    this.nodes.update(newNode);
    var jankreference = this;
    var nodesInGroup = this.nodes.get({
      filter: function(node) {
        return node.group == subnetName;
      }
    });

    nodesInGroup.forEach(function(element, index) {
      if(element.id != newNode.id) {
        jankreference.edges.add({from: newNode.id, to: element.id});
      }
    });
  }

  createEdges(subnet) {
    for(var i = 0; i < subnet.members.length; i++) {
      for(var j = i + 1; j < subnet.members.length; j++) {
        this.edges.add(new Edge(subnet.members[i],
            subnet.members[j]));
      }
    }
  }

  displayGraph() {
    var container = document.getElementById(this.containerId);
    var data = {nodes: this.nodes, edges: this.edges};
    this.network = new vis.Network(container, data, this.options);
  }

  setNodeGroup(nodeName, groupName) {
    var newNode = {id: nodeName, group: groupName};
    this.nodes.update(newNode);
  }

  // Used for when a new subnet is made, adds edges between all nodes in subnet
  // Also sets some nodes to the group "gateway" if they are in 2+ subnets
  setNodeGroups(subnet) {
    var newNodes = [];
    var jankreference = this;
    subnet.members.each(function(index, element) {
      newNodes.push({id: element, label: element, group: subnet.name});
    });
    this.nodes.update(newNodes);
  }
}

class Node {
  constructor(name, type, ip, mac, group) {
    this.id = name;
    this.label = name;
    this.type = type;
    this.ip = ip;
    this.mac = mac;
    this.group = group;
  }
}

class NodeData {
  constructor(numPis, numRadios) {
    this.numPis = numPis;
    this.numRadios = numRadios;
  }
}

class Subnet {
  constructor(name, ssid, addr, members) {
    this.name = name;
    this.ssid = ssid;
    this.addr = addr;
    this.members = members;
  }

  addNode(nodeName) {
    if($.inArray(nodeName, this.members) == -1) {
      this.members.push(nodeName);
    }
  }
}
