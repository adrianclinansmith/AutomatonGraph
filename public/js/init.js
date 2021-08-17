/* global Edge Graph State */
/* eslint-disable no-unused-vars */

// global data

const downloadButton = document.getElementById('downloadButton');
const newStateButton = document.getElementById('newStateButton');
const newEdgeButton = document.getElementById('newEdgeButton');
const playPauseButton = document.getElementById('playPauseButton');
const stopButton = document.getElementById('stopButton');
const uploadButton = document.getElementById('uploadButton');

let graph = initGraph(true);
let mouseIsDown = false;

// functions

function getMousePosition(event) {
    const CTM = graph.svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}

// function stopAnimation(inputWasAccepted) {
//     const resultLabel = document.getElementById('resultLabel');
//     if (inputWasAccepted) {
//         resultLabel.style.color = 'green';
//         resultLabel.innerHTML = 'accepted';
//     } else {
//         resultLabel.style.color = 'red';
//         resultLabel.innerHTML = 'rejected';
//     }
//     playPauseButton.innerHTML = 'play';
// }

function initGraph(addDefaultElements) {
    const svg = document.getElementById('svg');
    const stateElements = document.getElementsByClassName('state');
    const edgeElements = document.getElementsByClassName('edge');
    svg.addEventListener('mousedown', mousedown);
    svg.addEventListener('mousemove', mousemove);
    svg.addEventListener('mouseup', mouseup);
    svg.addEventListener('mouseleave', mouseleave);
    svg.addEventListener('dblclick', dblclick);
    for (const element of stateElements) {
        State.setLabelCallback(element);
    }
    for (const element of edgeElements) {
        Edge.setLabelCallback(element);
    }
    const newGraph = new Graph(svg);
    if (addDefaultElements === true) {
        const s0 = newGraph.addNewState({ x: 400, y: 250 });
        const s1 = newGraph.addNewState({ x: 600, y: 250 });
        s0.setLabel('s0');
        s1.setLabel('s1');
        s1.toggleGoal();
        newGraph.startTemporaryEdge(null, { x: 400, y: 150 });
        newGraph.temporaryEdgeHeadTo(s0.element, null);
        newGraph.setOrDeleteTemporaryEdge();
        const conectEdge = newGraph.startTemporaryEdge(s0.element, null);
        newGraph.temporaryEdgeHeadTo(s1.element, null);
        newGraph.setOrDeleteTemporaryEdge();
        conectEdge.setLabel('a,b,c');
        newGraph.deselect();
    }
    return newGraph;
}

// mouse event handlers

function mousedown(event) {
    mouseIsDown = true;
    const mousePosition = getMousePosition(event);
    const selectedObject = graph.select(event.target, mousePosition);
    if (event.altKey && selectedObject instanceof State) {
        selectedObject.toggleGoal();
    } else if (newEdgeButton.isPressed) {
        graph.startTemporaryEdge(event.target, mousePosition);
    }
}

function mousemove(event) {
    if (!mouseIsDown) {
        return;
    }
    const mousePosition = getMousePosition(event);
    if (newEdgeButton.isPressed) {
        graph.temporaryEdgeHeadTo(event.target, mousePosition);
    } else {
        graph.moveSelectedTo(mousePosition);
    }
}

function mouseup(event) {
    mouseIsDown = false;
    if (newEdgeButton.isPressed) {
        graph.setOrDeleteTemporaryEdge();
    }
    if (graph.selectedObject instanceof Edge) {
        graph.selectedObject.focusLabel();
    }
}

function mouseleave(event) {
    if (newEdgeButton.isPressed && mouseIsDown) {
        graph.deleteTemporaryEdge();
    }
}

function dblclick(event) {
    if (graph.selectedObject instanceof State) {
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

newEdgeButton.addEventListener('click', () => {
    newEdgeButton.isPressed = !newEdgeButton.isPressed;
    if (newEdgeButton.isPressed) {
        newEdgeButton.style.borderStyle = 'inset';
    } else {
        newEdgeButton.style.borderStyle = '';
    }
});

newStateButton.addEventListener('click', () => {
    graph.addNewState();
});

playPauseButton.addEventListener('click', () => {
    if (playPauseButton.innerHTML === 'play') {
        playPauseButton.innerHTML = 'pause';
    } else {
        playPauseButton.innerHTML = 'play';
    }
    document.getElementById('resultLabel').innerHTML = '';
    graph.startAnimation();
});

stopButton.addEventListener('click', () => {
    graph.stopAnimation();
});

uploadButton.addEventListener('change', () => {
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

// Animation Callbacks

function edgeAnimationBegan(event) {
    graph.activeStates++;
}

function edgeAnimationEnded(event) {
    if (!graph.animationShouldPlay) {
        return;
    }
    const edge = new Edge(event.target.parentNode.parentNode.children[0]);
    edge.head.animate(edge.input());
}

function stateAnimationEnded(event) {
    if (!graph.animationShouldPlay) {
        return;
    }
    graph.activeStates--;
    const state = new State(event.target);
    const input = state.input();
    if (input?.length === 0 && state.isGoal()) {
        graph.stopAnimation(true);
        playPauseButton.innerHTML = 'play';
        return;
    }
    let anEdgeWasAnimated = false;
    for (const outEdge of state.outEdges()) {
        const wasAnimated = outEdge.animateOnValidInput(input);
        if (wasAnimated) {
            anEdgeWasAnimated = true;
        }
    }
    if (!anEdgeWasAnimated && graph.activeStates === 0) {
        graph.stopAnimation(false);
        playPauseButton.innerHTML = 'play';
    }
}
