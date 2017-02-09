$(document).ready(function() {
  // Global variables
  var nodeData = new NodeData(0, 0);
  var subnets = new Array();
  var graphData = new GraphData(new vis.DataSet(), new vis.DataSet(), "graph");

  $("#add-button").click(function() {
    $("#add-container").toggle();
  });

  $("#add-container").click(function() {
    $("#export-textarea").hide();
  });

  $("#export-button").click(exportData);

  $("#import-button").click(importData);

  $("#subnet-add-member-button").click(addSubnetMember);

  $("#save-subnet-button").click(function() {
    saveSubnet();
    graphData.displayGraph();
  });

  $("#node-type-dropdown li").click(function() {
    $("#node-type-label").text($(this).text());
  });

  $("#save-node-button").click(function() {
    saveNode();
    graphData.displayGraph()
  });

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

  function exportData() {
    var exportArray = new Array();
    subnets.forEach(function(subnet, index) {
      console.log(subnet);
      exportArray.push(subnet);
    });
    graphData.nodes.forEach(function(node, index) {
      exportArray.push(node);
    });

    // Write data to developer console in browser
    console.log(JSON.stringify(exportArray));
    $("#export-textarea").text(JSON.stringify(exportArray));
  }

  function importData() {
    importString = $("#export-textarea")[0].value;
    var arr = JSON.parse(importString);
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

    console.log("nodeName: " + nodeName);
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
});
