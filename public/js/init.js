/* global Graph State */
/* eslint-disable no-unused-vars */

// global data

const downloadButton = document.getElementById('downloadButton');
const newStateButton = document.getElementById('newStateButton');
const newEdgeButton = document.getElementById('newEdgeButton');
const uploadButton = document.getElementById('uploadButton');

let graph = initGraph();
let mouseIsDown = false;

// functions

function getMousePosition(event) {
    const CTM = graph.svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}

function initGraph() {
    const svg = document.getElementById('svg');
    svg.addEventListener('mousedown', mousedown);
    svg.addEventListener('mousemove', mousemove);
    svg.addEventListener('mouseup', mouseup);
    svg.addEventListener('mouseleave', mouseleave);
    svg.addEventListener('dblclick', dblclick);
    const states = document.getElementsByClassName('state');
    for (const state of states) {
        State.setLabelCallback(state);
    }
    return new Graph(svg);
}

// mouse event handlers

function mousedown(event) {
    mouseIsDown = true;
    const mousePosition = getMousePosition(event);
    graph.select(event.target, mousePosition);
    if (newEdgeButton.isPressed) {
        graph.startTemporaryEdge(event.target, mousePosition);
    }
}

function mousemove(event) {
    if (!mouseIsDown) {
        return;
    }
    const mousePosition = getMousePosition(event);
    if (newEdgeButton.isPressed) {
        graph.temporaryEdgeTailTo(event.target, mousePosition);
    } else {
        graph.moveSelectedTo(mousePosition);
    }
}

function mouseup(event) {
    mouseIsDown = false;
    if (newEdgeButton.isPressed) {
        graph.setOrDeleteTemporaryEdge();
    }
}

function mouseleave(event) {
    if (newEdgeButton.isPressed && mouseIsDown) {
        graph.deleteTemporaryEdge();
    }
}

function dblclick(event) {
    if (event.target.getAttributeNS(null, 'class') === 'state') {
        graph.selectedObject.focusLabel();
    }
}

// button event handlers

downloadButton.addEventListener('click', () => {
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(graph.xmlBlob());
    downloadLink.download = 'mygraph.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

newStateButton.addEventListener('click', () => {
    graph.addNewState();
});

uploadButton.addEventListener('change', () => {
    console.log('changed upload input');
    const newSvgBlob = uploadButton.files[0];
    newSvgBlob.text().then(
        (newSvgText) => {
            document.getElementById('svgDiv').innerHTML = newSvgText;
            graph = initGraph();
        },
        (error) => {
            console.log(error);
        });
});
