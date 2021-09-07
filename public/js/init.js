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

function finishedInputLineAndAccept(accepted) {
    console.log(`~~~${accepted ? 'ACCEPT' : 'REJECT'}~~~`);
    graph.acceptedAll = graph.acceptedAll && accepted;
    const result = accepted ? ' ✓' : ' ❌';
    const lineNo = graph.currentLineNo;
    inputEditor.value = Util.appendToLine(inputEditor.value, result, lineNo);
    const triggeredInitialEdges = graph.animateNextInput();
    if (triggeredInitialEdges === 0) {
        finishedInputLineAndAccept(false);
    } else if (triggeredInitialEdges < 0) {
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
        edgeLabel.onmousedown = onEdgeLabelMouseDown;
        edgeLabel.ondblclick = onEdgeLabelDoubleClick;
        edgeLabel.onfocusout = onEdgeLabelFocusOut;
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
        conectEdge.setLabel('a,b');
        newGraph.deselect();
    }
    return newGraph;
}

// mouse event handlers

function mousedown(event) {
    console.log('mousedown:');
    console.log(event.target);
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
    // if (event.target.getAttribute('class') === 'edge-label' &&
    //    event.target.value.length > 0) {
    //     event.target.focus();
    // } else
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
    console.log('\n\n\npressed play:\n\n\n');
    document.getElementById('resultLabel').innerHTML = '';
    clearInputScore();
    const inputString = inputEditor.value.replace(/[ ]+/g, '');
    graph.inputs = inputString.split('\n');
    graph.currentLineNo = 0;
    graph.acceptedAll = true;
    const numberInitiallyAccepted = graph.startAnimation();
    if (numberInitiallyAccepted === 0) {
        finishedInputLineAndAccept(false);
    }
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
    clearInputScore();
});

// Animation Callbacks

function edgeAnimationBegin(event) {
    // const edge = new Edge(event.target);
    // console.log(`${edge.id()}: BEGIN edge animation`);
}

function edgeAnimationEnd(event) {
    const edge = new Edge(event.target);
    if (edge.hasNoInputs()) {
        return;
    }
    console.log(`${edge.id()}: END edge animation`);
    console.log(`  Stored inputs: "${edge._storedInputsArray()}"`);
    edge.dumpInputsToHead();
    edge.head.animate();
}

function stateAnimationBegin(event) {
    // const state = new State(event.target);
    // console.log(`${state.id()}: BEGIN state animation`);
    graph.numberOfActiveStates++;
    graph.anInputWasAccepted = false;
}

function stateAnimationEnd(event) {
    const state = new State(event.target);
    if (state.hasNoInputs()) {
        return;
    }
    console.log(`${state.id()}: END state animation`);
    console.log(`  Stored inputs: "${state._storedInputsArray()}"`);
    graph.numberOfActiveStates--;
    let input;
    while ((input = state.popInput())) {
        if (input === ' ' && state.isGoal()) {
            finishedInputLineAndAccept(true);
            return;
        }
        for (const outEdge of state.outEdges()) {
            if (outEdge.consumeInput(input)) {
                outEdge.animate();
                graph.anInputWasAccepted = true;
            }
        }
    }
    if (graph.numberOfActiveStates === 0 && !graph.anInputWasAccepted) {
        finishedInputLineAndAccept(false);
    }
}

// Graph Element Callbacks

function onEdgeLabelMouseDown(event) {
    // console.log('edge label mouse down');
}

function onEdgeLabelDoubleClick(event) {
    console.log('edge label double click');
    event.target.style['user-select'] = 'all';
    event.target.style['-webkit-user-select'] = 'all';
    event.target.select();
}

function onEdgeLabelFocusOut(event) {
    console.log('edge label focus out');
    event.target.style['user-select'] = 'none';
    event.target.style['-webkit-user-select'] = 'none';
}

function onEdgeLabelInput(event) {
    const labelElement = event.target;
    labelElement.setAttributeNS(null, 'value', labelElement.value);
    labelElement.setAttributeNS(null, 'size', labelElement.value.length);
    if (labelElement.value.length > 0) {
        labelElement.style.pointerEvents = 'auto';
    } else {
        labelElement.style.pointerEvents = 'none';
    }
}

function onStateLabelInput(event) {
    const labelElement = event.target;
    labelElement.setAttributeNS(null, 'value', labelElement.value);
    let textOverflow = true;
    let fontSize = 25;
    while (textOverflow && fontSize > 1) {
        labelElement.style.fontSize = `${fontSize}px`;
        textOverflow = labelElement.scrollWidth > labelElement.clientWidth;
        fontSize -= 1;
    }
}
