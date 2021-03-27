/* global Graph */
/* eslint-disable no-unused-vars */

// global constants

const graph = new Graph(document.getElementById('svg'));
const newStateButton = document.getElementById('newStateButton');
const newEdgeButton = document.getElementById('newEdgeButton');

// global variables

let mouseIsDown = false;
let newEdge = null;

// helper functions

function getMousePosition(event) {
    const svg = document.getElementById('svg');
    const CTM = svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}

// mouse event handlers

graph.svg.addEventListener('mousedown', (event) => {
    mouseIsDown = true;
    const mousePosition = getMousePosition(event);
    graph.select(event.target, mousePosition);
    if (newEdgeButton.isPressed) {
        newEdge = new Edge(selectedGraphObject);
    }
});

graph.svg.addEventListener('mousemove', (event) => {
    if (!mouseIsDown) {
        return;
    }
    const mousePosition = getMousePosition(event);
    if (newEdgeButton.isPressed) {
        newEdge.setHead(event.target, mousePosition);
    } else {
        graph.moveSelected(mousePosition);
    }
});

graph.svg.addEventListener('mouseup', (event) => {
    mouseIsDown = false;
    if (newEdge?.pointsToState()) {
        graph.addEdge(newEdge);
        graph.select(newEdge);
    }
    newEdge = null;
});

graph.svg.addEventListener('mouseleave', (event) => {
    newEdge = null;
});

// button event handlers

newStateButton.addEventListener('click', () => {
    graph.newStateAt({ x: 50, y: 50 });
});
