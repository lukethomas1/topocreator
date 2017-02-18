$(document).ready(function() {
  // Global variables
  var db = firebase.database();
  var dataHolder = new DataHolder(new vis.DataSet(), new Array(), new vis.DataSet());
  var subnets = new Array();
  var graphData = new GraphData(new vis.DataSet(), new vis.DataSet(), "graph");
  // Attaches handlers to the graph
  applyNetworkHandlers();

  $("#add-button").click(function() {
    $("#add-container").toggle();
  });

  $("#button-change-node").click(changeNodeData);

  $("#button-delete-node").click(deleteSelectedNode);

  $("#button-edit-subnet").click(editSubnet);

  $("#button-hide-show-tabs").click(function() {
    $(".tab-content").toggle();
    $("#button-hide-show-tabs span").toggleClass("glyphicon-chevron-down glyphicon-chevron-up");
  });

  $("#edit-subnet-colors-tab").click(loadSubnetColorTable);

  $("#edit-subnet-tab").click(function() {
    $("#button-dropdown-edit-subnet").html('Choose Subnet<span class="caret"></span>');
    loadSubnetDropdowns();
    loadMemberTable();
  });

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
    graphData.updateGraph()
  });

  $("#save-subnet-button").click(function() {
    saveSubnet();
    graphData.updateGraph()
  });

  function addNodeToSubnet(nodeName, subnetName) {
    subnets.forEach(function(element, index) {
      if(element.name == subnetName) {
        subnets[index].addNode(nodeName); 
      }
    });
  }

  // Used to apply user events in the graph
  function applyNetworkHandlers() {
    graphData.network.on("selectNode", function(params) {
      changeNode(params.nodes[0]);
    });
    graphData.network.on("deselectNode", function() {
      hideChangeForm()
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
    hideChangeForm();
  }

  function deleteSelectedNode() {
    var nodeId = graphData.network.getSelection().nodes[0];
    graphData.nodes.remove(nodeId);
    hideChangeForm();
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
    var subName = $("#button-dropdown-edit-subnet").text();
    var subSSID = $("#input-edit-subnet-ssid")[0].value;
    var subAddr = $("#input-edit-subnet-addr")[0].value;
    var thisSubnet = null;

    subnets.forEach(function(subnet, index) {
      if(subnet.name == subName) {
        thisSubnet = subnet;
      }
    });

    if(subSSID) {
      thisSubnet.ssid = subSSID;
    }
    if(subAddr) {
      thisSubnet.addr = subAddr;
    }
    graphData.updateGraph(subnets);
  }

  function editSubnetMemberClicked(e) {
    // turn background green
    $(this).toggleClass("member-selected");
    // if we just added the member-selected class, add the node to the subnet
    if($(this).hasClass("member-selected")) {
      e.data.subnet.addNode($(this).text());
    }
    // otherwise remove the node from the subnet
    else {
      var self = this;
      var arr = e.data.subnet.members;
      e.data.subnet.members.forEach(function(member, index) {
        if(member == $(self).text()) {
          arr.splice(index, 1);
        }
      });
    }
    graphData.updateGraph(subnets);
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

  function hideChangeForm() {
    $("#change-node-form").hide();
    $("#change-node-ip-input").val('');
    $("#change-node-mac-input").val('');
  }

  function importData(importString) {
    var arr = tryParseJSON(importString);
    // If not valid json, it is a save file name
    if(!arr) {
      importFromFirebase(importString);
      return;
    }

    subnets = new Array();
    graphData.nodes = new vis.DataSet();
    graphData.edges = new vis.DataSet();

    arr.forEach(function(element, index) {
      if(element.name) {
        var membersArray = $.map(element.members, function(value, index) {
          return [value];
        });
        var subnet = new Subnet(element.name, element.ssid, element.addr, membersArray);
        subnets.push(subnet);
      } else {
        var node = new Node(element.id, element.type, element.ip, element.mac, element.group);
        graphData.addNode(node);
      }
    });

    graphData.updateGraph(subnets);
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

  // Create a table with all the nodes
  // Called when the "Edit Subnets" tab is chosen
  function loadMemberTable() {
    var table = $(".member-table")[0];
    $(table).empty();
    var newRow = document.createElement("tr");
    graphData.nodes.forEach(function(node, index) {
      // Make a new row every 5 nodes
      if((index + 1) % 5 == 0) {
        table.appendChild(newRow);
        newRow = document.createElement("tr");
      }
      var newData = document.createElement("td");
      var nodeName = node.id;
      newData.className = "member-data";
      var tNode = document.createTextNode(nodeName);
      newData.appendChild(tNode);
      newRow.appendChild(newData);
    });
    table.appendChild(newRow);
  }

  function loadSubnetColorTable() {
    var table = $("#edit-subnet-colors-table");
    var htmlString = "<thead><th>Subnet</th><th>Color</th></thead>";
    subnets.forEach(function(subnet, index) {
      var color = graphData.network.groups.groups[subnet.name].color.background;
      htmlString += '<tr class="color-table-row"><td>' + subnet.name + '</td>';
      htmlString += '<td style="background-color: ' + color + ';">' + color + '</td></tr>';
    });
    table.html(htmlString);
  }

  // Called when the "Edit Subnets" tab is chosen
  function loadSubnetDropdowns() {
    var dropdownContainer = $("#subnet-dropdowns");
    var innerHTMLString = "";
    subnets.forEach(function(subnet, index) {
      innerHTMLString += '<li><a href="#">' + subnet.name + '</a></li>';
    });
    dropdownContainer.html(innerHTMLString);

    $(".dropdown-menu li a").click(function() {
      var subnetName = $(this).text();
      $(this).parents(".dropdown").find(".btn").html(subnetName +
        '<span class="caret"></span>');
      loadSubnetMembers(subnetName);
    });
  }

  // Called when a specific subnet is chosen from the dropdown
  function loadSubnetMembers(subnetName) {
    dataHolder.subnets = subnets;
    var subnet = dataHolder.findSubnet(subnetName);
    var members = $(".member-data");
    $.each(members, function(index, member) {
      if($.inArray($(member).text(), subnet.members) > -1) {
        members[index].className = "member-data member-selected";
      }
      else {
        members[index].className = "member-data";
      }
    });
    // Clear handlers on the boxes before adding new ones
    members.off();
    // Add a handler to each table data
    members.click({subName: subnetName, subnet: subnet}, editSubnetMemberClicked);
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
    var nodeName = $("#input-node-name")[0].value;
    var nodeIp = $("#input-node-ip")[0].value;
    var nodeMac = $("#input-node-mac")[0].value;
    var nodeType = "Pi"; // temporary

    if(nodeName == "") {
      // Automatically name the node according to its type
      switch(nodeType) {
        case "Radio":
          nodeData.numRadios++;
          nodeName = "radio" + nodeData.numRadios;
          break;
        default:
          nodeData.numPis++;
          nodeName = "pi" + nodeData.numPis;
          break;
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
    var memberArray = new Array();

    if(!subName) {
      return;
    }

    tempMembers.each(function(index, member) {
      memberArray.push(member.innerHTML.substring(6));
    });
    var newSubnet = new Subnet(subName, subSSID, subAddr, memberArray);
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
