/* global Edge Graph State Util */
/* eslint-disable no-unused-vars */

// global data

const downloadButton = document.getElementById('downloadButton');
const newStateButton = document.getElementById('newStateButton');
const newEdgeButton = document.getElementById('newEdgeButton');
const playPauseButton = document.getElementById('playPauseButton');
const stopButton = document.getElementById('stopButton');
const uploadButton = document.getElementById('uploadButton');

const inputEditor = document.getElementById('inputEditor');
const resultLabel = document.getElementById('resultLabel');

let graph = initGraph(true);
let mouseIsDown = false;

// functions

function clearInputScore() {
    inputEditor.value = inputEditor.value.replace(/( ✓)|( ❌)/g, '');
}

function getMousePosition(event) {
    const CTM = graph.svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}

function finishedInputLineAndAccept(acceptedCurrent) {
    graph.acceptedAll = graph.acceptedAll && acceptedCurrent;
    const lineNo = graph.currentLineNo;
    const result = acceptedCurrent ? ' ✓' : ' ❌';
    inputEditor.value = Util.appendToLine(inputEditor.value, result, lineNo);
    playPauseButton.innerHTML = 'play';
    const inputIsFinished = !graph.animateNextInput();
    if (inputIsFinished) {
        resultLabel.style.color = graph.acceptedAll ? 'green' : 'red';
        resultLabel.innerHTML = graph.acceptedAll ? 'accepted' : 'rejected';
    }
}

function initGraph(addDefaultElements) {
    const svg = document.getElementById('svg');
    const stateElements = document.getElementsByClassName('state');
    const edgeElements = document.getElementsByClassName('edge');
    svg.addEventListener('mousedown', mousedown);
    svg.addEventListener('mousemove', mousemove);
    svg.addEventListener('mouseup', mouseup);
    svg.addEventListener('mouseleave', mouseleave);
    svg.addEventListener('dblclick', dblclick);
    for (const stateElement of stateElements) {
        const stateLabel = stateElement.parentNode.children[2].children[0];
        stateLabel.oninput = onStateLabelInput;
    }
    for (const edgeElement of edgeElements) {
        const edgeLabel = edgeElement.parentNode.children[1].children[0];
        edgeLabel.oninput = onEdgeLabelInput;
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
    const inputs = inputEditor.value;
    graph.inputs = inputs.split('\n');
    graph.currentLineNo = 0;
    graph.acceptedAll = true;
    clearInputScore();
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

// editor event handlers

inputEditor.addEventListener('focus', () => {
    console.log('editor on focus');
    clearInputScore();
});

// Animation Callbacks

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
    if (state.isGoalWithNoInput()) {
        finishedInputLineAndAccept(true);
        return;
    }
    const newlyAnimatedEdges = state.sendInputToOutEdges();
    graph.activeStates += newlyAnimatedEdges;
    if (graph.activeStates === 0) {
        finishedInputLineAndAccept(false);
    }
}

// Graph Element Callbacks

function onEdgeLabelInput(event) {
    console.log('onEdgeLabelInput');
    event.target.setAttributeNS(null, 'value', event.target.value);
};

function onStateLabelInput(event) {
    console.log('onStateLabelInput');
    const labelElement = event.target;
    let textOverflow = true;
    let size = 25;
    while (textOverflow && size > 1) {
        labelElement.style.fontSize = `${size}px`;
        labelElement.setAttributeNS(null, 'value', labelElement.value);
        textOverflow = labelElement.scrollWidth > labelElement.clientWidth;
        size -= 1;
    }
};
