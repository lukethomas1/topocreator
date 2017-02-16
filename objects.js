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

    // Options that effect the cosmetics of the graph
    this.options = {
      interaction:{
        dragNodes:true,
        dragView: true,
        hover: true,
        multiselect: false,
        navigationButtons: false,
        selectable: true,
        selectConnectedEdges: false,
        tooltipDelay: 300,
        zoomView: true
      },
      layout: {
        improvedLayout:true,
      }
    }

    // Creates an empty network to start out
    var container = document.getElementById("graph");
    this.network = new vis.Network(container, {nodes: this.nodes, edges: this.edges}, this.options);
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

  updateGraph() {
    var data = {nodes: this.nodes, edges: this.edges};
    this.network.setData(data);
    this.network.redraw();
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
    $.each(subnet.members, function(index, element) {
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