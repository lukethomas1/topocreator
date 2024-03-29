// File: objects.js
// Author: Luke Thomas
// Date: March 30, 2017
// Description: This file has classes for objects used in index.js, such as
// Node and Subnet. GraphData is VERY important, has everything to do with
// Vis.js and the displayed graph. Vis.js has great documentation, go to their
// website for help.

class DataHolder {
  constructor(nodes, subnets, edges) {
    this.nodes = nodes;
    this.subnets = subnets;
    this.edges = edges;
  }

  findSubnet(subnetName) {
    var found = null;
    $.each(this.subnets, function(index, subnet) {
      if(subnet.name == subnetName) {
        found = subnet;
      }
    });
    return found;
  }
}

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
      edges: {
        physics: false,
        smooth: {
          type: "continuous",
          forceDirection: "none"
        }
      },
      interaction:{
        dragNodes: true,
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
        improvedLayout: true
      },
      physics: {
        enabled: false
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

  // Create edges for all subnets passed in
  createAllEdges(subnetArray) {
    var jankreference = this;
    this.edges = new vis.DataSet(); // reset all edges
    $.each(subnetArray, function(index, subnet) {
      jankreference.createEdges(subnet);
    });
  }

  // Create an edge from every member of the subnet to every other member
  createEdges(subnet) {
    for(var i = 0; i < subnet.members.length; i++) {
      for(var j = i + 1; j < subnet.members.length; j++) {
        this.edges.add(new Edge(subnet.members[i],
            subnet.members[j]));
      }
    }
  }

  // Redraws the graph, will remake edges if subnetArray is supplied
  updateGraph(subnetArray) {
    if(subnetArray) {
      this.createAllEdges(subnetArray);
      this.setAllNodeGroups(subnetArray);
    }
    var data = {nodes: this.nodes, edges: this.edges};
    this.network.setData(data);
    this.network.redraw();
  }

  removeNode(subnets, nodeId) {
    this.nodes.remove(nodeId);
    var jankRef = this;
    $.each(subnets, function(index, subnet) {
      jankRef.removeNodeFromSubnetMembers(nodeId, subnet);
    });
  }

  removeNodeFromSubnetMembers(nodeId, subnet) {
    var index = subnet.members.indexOf(nodeId);
    if(index >= 0) {
      subnet.members.splice(index, 1);
    }
  }

  resetNodeGroups() {
    var jankRef = this;
    this.nodes.forEach(function(node, index) {
      jankRef.nodes.update({id: node.id, group: "default"});
    });
  }

  setAllNodeGroups(subnetArray) {
    this.resetNodeGroups();
    var jankreference = this;
    $.each(subnetArray, function(index, subnet) {
      jankreference.setNodeGroups(subnet);
    });
  }

  setNodeGroup(nodeName, groupName) {
    this.nodes.update({id: nodeName, group: groupName});
  }

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
