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

let graph = initGraph(true);

// functions

document.addEventListener('keydown', event => {
    const pressedDelete = event.code === 'Backspace';
    if (pressedDelete && graph.selectedObject?.labelValue() === '') {
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

function initGraph(addDefaultElements) {
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
    const newGraph = new Graph(svg);
    if (addDefaultElements) {
        const s0 = newGraph.addNewState({ x: 400, y: 250 });
        const s1 = newGraph.addNewState({ x: 600, y: 250 });
        s0.setLabelText('s0');
        s1.setLabelText('s1');
        s1.toggleGoal();
        newGraph.startTemporaryEdge(null, { x: 400, y: 150 });
        newGraph.temporaryEdgeHeadTo(s0.element, null);
        newGraph.setOrDeleteTemporaryEdge();
        const conectEdge = newGraph.startTemporaryEdge(s0.element, null);
        newGraph.temporaryEdgeHeadTo(s1.element, null);
        newGraph.setOrDeleteTemporaryEdge();
        conectEdge.setLabelText('a,b');
        newGraph.deselect();
    }
    return newGraph;
}

// ************************************************************************
// Button Event Listeners
// ************************************************************************

page.downloadButton.addEventListener('click', () => {
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
        page.newEdgeButton.style.borderStyle = 'inset';
    } else {
        page.newEdgeButton.style.borderStyle = '';
    }
});

page.newStateButton.addEventListener('click', () => {
    graph.addNewState();
});

page.playPauseButton.addEventListener('click', () => {
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
