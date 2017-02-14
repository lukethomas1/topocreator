$(document).ready(function() {
  // Global variables
  var db = firebase.database();
  var nodeData = new NodeData(0, 0);
  var subnets = new Array();
  var graphData = new GraphData(new vis.DataSet(), new vis.DataSet(), "graph");

  $("#add-button").click(function() {
    $("#add-container").toggle();
  });

  $("#button-change-node").click(changeNodeData);

  $("#button-edit-subnet").click(editSubnet);

  $("#export-button").click(function() {
    var exportName = $("#export-textarea")[0].value;
    saveExport(exportName);
  });

  $("#import-button").click(function() {
    var importString = $("#export-textarea")[0].value;
    importData(importString);
  });

  $("#node-type-dropdown li").click(function() {
    $("#node-type-label").text($(this).text());
  });

  $("#save-export-button").click(function() {
    saveExport();
    $("#save-export-form").hide();
  });

  $("#save-node-button").click(function() {
    saveNode();
    loadGraph();
  });

  $("#save-subnet-button").click(function() {
    saveSubnet();
    loadGraph();
  });

  $("#subnet-add-member-button").click(addSubnetMember);

  function addNodeToSubnet(nodeName, subnetName) {
    subnets.forEach(function(element, index) {
      if(element.name == subnetName) {
        subnets[index].addNode(nodeName); 
      }
    });
  }

  function addSubnetMember() {
    var memberName = $("#subnet-member-input").val();
    var htmlString = '<p class="subnet-member">Node: ' + memberName + "</p>";
    $("#subnet-members").append(htmlString);
    $(".subnet-member").click(function() {
      this.remove();
    });
  }

  // Used to apply user events in the graph
  function applyNetworkHandlers() {
    graphData.network.on("selectNode", function(params) {
      changeNode(params.nodes[0]);
    });
  }

  // Called when user selects a node in the graph
  function changeNode(nodeId) {
    var currNode = graphData.nodes.get(nodeId);
    $("#change-node-ip-input").attr("placeholder", "Ip: " + currNode.ip);
    $("#change-node-mac-input").attr("placeholder", "Mac: " + currNode.mac);
    var net = $(".vis-network");
    var topOffset = net.offset().top + 32;
    $("#change-node-form").css({
      'top': topOffset
    });
    $("#change-node-form").show();
  }

  // Called when the change form "Save" button is clicked
  function changeNodeData() {
    var nodeId = graphData.network.getSelection().nodes[0];
    var newIp = $("#change-node-ip-input")[0].value;
    var newMac = $("#change-node-mac-input")[0].value;
    var changedNode = { id: nodeId };
    if(newIp) {
      changedNode['ip'] = newIp;
    }
    if(newMac) {
      changedNode['mac'] = newMac;
    }
    graphData.nodes.update(changedNode);
    $("#change-node-form").hide();
    $("#change-node-ip-input").val('');
    $("#change-node-mac-input").val('');
  }

  function displaySubnetCheckboxes() {
    var checkboxDiv = $("#subnet-checkboxes");
    var htmlString = "";

    subnets.forEach(function(element, index) {
      htmlString += '<label class="sub-checkbox">';
      htmlString += '<input type="checkbox" value="' + element.name + '">' + element.name + '</label>';
    });
    checkboxDiv.html(htmlString);

    $("#add-subnet-form").css("min-height", function() {
      return $("#add-node-form").height() + 4;
    });
  }

  function editSubnet() {
    var subName = $("#input-edit-subnet-name")[0].value;
    var subSSID = $("#input-edit-subnet-ssid")[0].value;
    var subAddr = $("#input-edit-subnet-addr")[0].value;
    var exists = false;

    subnets.forEach(function(subnet, index) {
      if(subnet.name == subName) {
        exists = true;
        subnets[index].ssid = subSSID;
        subnets[index].addr = subAddr;
        console.log("subnet " + subName + " changed");
      }
    });

    if(!exists) {
      alert("Subnet " + subName + " doesn't exist.");
    }
  }

  function exportData() {
    var exportString = getExportString();
    // Write data to developer console in browser
    console.log(exportString);
    $("#export-textarea").val(exportString);
  }

  // Returns a json string representing the current topology
  function getExportString() {
    var exportArray = new Array();
    subnets.forEach(function(subnet, index) {
      exportArray.push(subnet);
    });
    graphData.nodes.forEach(function(node, index) {
      exportArray.push(node);
    });
    return JSON.stringify(exportArray);
  }

  function importData(importString) {
    var arr = tryParseJSON(importString);
    // If not valid json, it is a save file name
    if(!arr) {
      importFromFirebase(importString);
      return;
    }

    subnets = new Array();
    graphData = new GraphData(new vis.DataSet(), new vis.DataSet(), 'graph');

    arr.forEach(function(element, index) {
      if(element.name) {
        subnets.push(element);
      } else {
        graphData.addNode(element);
      }
    });

    subnets.forEach(function(element, index) {
      graphData.createEdges(element);
      graphData.setNodeGroups(element);
    });
    loadGraph();
  }

  function importFromFirebase(saveName) {
    var saves = db.ref("saves");
    db.ref("saves/" + saveName).once("value").then(function(snapshot) {
      if(snapshot.val()) {
        importData(snapshot.val().string);
      }
      else {
        alert("Invalid JSON / No save named " + saveName);
      }
    });
  }

  function loadGraph() {
    graphData.displayGraph();
    applyNetworkHandlers();
  }

  function saveExport(exportName) {
    if(exportName == "") { 
      exportData();
      return;
    }
    var exportJSON = getExportString();
    var saves = db.ref("saves");

    saves.once("value", function(snapshot) {
      if(!snapshot.hasChild(exportName)) {
        db.ref('saves/' + exportName).set({
          string: exportJSON
        });
      }
      else {
        alert("That save name is taken.");
      }
    });
  }

  function saveNode() {
    var nodeType = $("#node-type-label")[0].innerHTML;
    var nodeName = $("#input-node-name")[0].value;
    var nodeIp = $("#input-node-ip")[0].value;
    var nodeMac = $("#input-node-mac")[0].value;

    if(nodeName == "") {
      // Automatically name the node according to its type
      switch(nodeType) {
        case "Pi":
          nodeData.numPis++;
          nodeName = "pi" + nodeData.numPis;
          break;
        case "Radio":
          nodeData.numRadios++;
          nodeName = "radio" + nodeData.numRadios;
          break;
        default:
          return;
      }
    }

    var newNode = new Node(nodeName, nodeType, nodeIp, nodeMac, "default", new Array());
    graphData.addNode(newNode);

    // Add the node to the subnets checked off
    var checkboxes = $(".sub-checkbox input:checked");
    if(checkboxes.length > 0) {
      checkboxes.each(function(index, element) {
        // for the export data
        addNodeToSubnet(nodeName, element.value);
        // for the visualizer
        graphData.connectNodeToSubnet(newNode.id, element.value);
      });
    }
  }

  function saveSubnet() {
    var subName = $("#input-subnet-name")[0].value;
    var subSSID = $("#input-subnet-ssid")[0].value;
    var subAddr = $("#input-subnet-addr")[0].value;
    var tempMembers = $("#subnet-members .subnet-member");

    if(!subName) {
      return;
    }

    tempMembers.each(function(index, member) {
      tempMembers[index] = member.innerHTML.substring(6);
    });
    var newSubnet = new Subnet(subName, subSSID, subAddr, tempMembers);
    subnets.push(newSubnet);
    graphData.createEdges(newSubnet);
    graphData.setNodeGroups(newSubnet);
    // Add a new checkbox for node creation
    displaySubnetCheckboxes();
    $("#subnet-members").html("");
  }

  function tryParseJSON(string) {
    try {
      var object = JSON.parse(string);
      
      if(object && typeof(object) === "object") {
        return object;
      }
    }
    catch(e) {}
    return false;
  }
});
