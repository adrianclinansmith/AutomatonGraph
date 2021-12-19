/* eslint-disable no-undef */
/* global Graph Util */
/* eslint-disable no-unused-vars */

// global data

const page = {};
page.downloadButton = document.getElementById('downloadButton');
page.newStateButton = document.getElementById('newStateButton');
page.newEdgeButton = document.getElementById('newEdgeButton');
page.playPauseButton = document.getElementById('playPauseButton');
page.stopButton = document.getElementById('stopButton');
page.uploadButton = document.getElementById('uploadButton');
page.inputEditor = document.getElementById('inputEditor');
page.resultLabel = document.getElementById('resultLabel');

let graph;

// ************************************************************************
// Page Load
// ************************************************************************

window.onload = function() {
    if (navigator.userAgent.indexOf('Firefox') !== -1) {
        console.log('firefox');
    } else if (navigator.userAgent.indexOf('Chrome') !== -1) {
        const stateGTemplate = document.getElementById('state-g-template');
        const foTemplate = stateGTemplate.children[2];
        const x = `${parseInt(foTemplate.getAttributeNS(null, 'x')) - 1}`;
        const y = `${parseInt(foTemplate.getAttributeNS(null, 'y')) + 2}`;
        foTemplate.setAttributeNS(null, 'x', x);
        foTemplate.setAttributeNS(null, 'y', y);
    }
    graph = initGraph();
    const midx = graph.svg.clientWidth / 2;
    const midy = graph.svg.clientHeight / 2;
    const s0 = graph.addNewState({ x: midx - 100, y: midy });
    const s1 = graph.addNewState({ x: midx + 100, y: midy });
    s1.toggleGoal();
    graph.startTemporaryEdge(null, { x: s0.x, y: midy - 100 });
    graph.temporaryEdgeHeadTo(s0.element, null);
    graph.setOrDeleteTemporaryEdge();
    const conectEdge = graph.startTemporaryEdge(s0.element, null);
    graph.temporaryEdgeHeadTo(s1.element, null);
    graph.setOrDeleteTemporaryEdge();
    conectEdge.setLabelText('a,b');
    graph.deselect();
};

// ************************************************************************
// Functions
// ************************************************************************

document.addEventListener('keydown', event => {
    const pressedDelete = event.code === 'Backspace';
    if (pressedDelete && graph.selectedObject?.labelValue() === '') {
        graph.removeFromAnimateArray(graph.selectedObject);
        graph.selectedObject.remove();
        graph.selectedObject = null;
    }
});

page.clearInputScore = function() {
    page.inputEditor.value = page.inputEditor.value.replace(/( ✓)|( ❌)/g, '');
};

page.finishedInputLineAndAccept = function(accepted) {
    graph.acceptedAll = graph.acceptedAll && accepted;
    const result = accepted ? ' ✓' : ' ❌';
    const lineNo = graph.currentLineNo;
    page.inputEditor.value = Util.appendToLine(page.inputEditor.value, result, lineNo);
    const triggeredInitialEdges = graph.animateNextInput();
    if (triggeredInitialEdges === 0) {
        page.finishedInputLineAndAccept(false);
    } else if (triggeredInitialEdges < 0) {
        page.playPauseButton.innerHTML = '▶︎';
        page.resultLabel.style.color = graph.acceptedAll ? 'green' : 'red';
        page.resultLabel.innerHTML = graph.acceptedAll ? 'accepted' : 'rejected';
    }
};

function initGraph() {
    const svg = document.getElementById('svg');
    svg.addEventListener('mousedown', mousedownGraph);
    svg.addEventListener('mousemove', mousemoveGraph);
    svg.addEventListener('mouseup', mouseupGraph);
    svg.addEventListener('mouseleave', mouseleaveGraph);
    const stateElements = document.getElementsByClassName('state');
    for (const stateElement of stateElements) {
        GraphMaker.setStateEventListeners(stateElement);
    }
    const edgeElements = document.getElementsByClassName('edge');
    for (const edgeElement of edgeElements) {
        GraphMaker.setEdgeEventListeners(edgeElement);
    }
    return new Graph(svg);
}

// ************************************************************************
// Button Event Listeners
// ************************************************************************

page.downloadButton.addEventListener('click', () => {
    graph.deselect();
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(graph.xmlBlob());
    downloadLink.download = 'mygraph.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

page.newEdgeButton.addEventListener('click', () => {
    page.newEdgeButton.isPressed = !page.newEdgeButton.isPressed;
    if (page.newEdgeButton.isPressed) {
        page.newEdgeButton.style.color = 'grey';
        page.newEdgeButton.style.borderColor = 'grey';
    } else {
        page.newEdgeButton.style.color = '';
        page.newEdgeButton.style.borderColor = '';
    }
});

page.newStateButton.addEventListener('click', () => {
    graph.addNewState();
});

page.playPauseButton.addEventListener('click', () => {
    graph.deselect();
    if (graph.svg.animationsPaused()) {
        graph.svg.unpauseAnimations();
        page.playPauseButton.innerHTML = '‖';
        return;
    } else if (page.playPauseButton.innerHTML === '‖') {
        graph.svg.pauseAnimations();
        page.playPauseButton.innerHTML = '▶︎';
        return;
    }
    page.playPauseButton.innerHTML = '‖';
    document.getElementById('resultLabel').innerHTML = '';
    page.clearInputScore();
    const inputString = page.inputEditor.value.replace(/[ ]+/g, '');
    graph.inputs = inputString.split('\n');
    graph.currentLineNo = 0;
    graph.acceptedAll = true;
    const numberInitiallyAccepted = graph.startAnimation();
    if (numberInitiallyAccepted === 0) {
        page.finishedInputLineAndAccept(false);
    }
});

page.stopButton.addEventListener('click', () => {
    page.playPauseButton.innerHTML = '▶︎';
    graph.stopAnimation();
});

page.uploadButton.addEventListener('change', () => {
    const newSvgBlob = page.uploadButton.files[0];
    newSvgBlob.text().then(
        (newSvgText) => {
            document.getElementById('svgDiv').innerHTML = newSvgText;
            graph = initGraph();
        },
        (error) => {
            console.log(error);
        });
});

// ************************************************************************
// Text Editor Event Listeners
// ************************************************************************

page.inputEditor.addEventListener('focus', () => {
    page.clearInputScore();
});
