/* eslint-disable no-unused-vars */
/* global Edge graph GraphMaker page State */

// ************************************************************************
// Graph Event Listeners
// ************************************************************************

function mousedownGraph(event) {
    graph.mouseIsDown = true;
    const mousePosition = graph.getMousePosition(event);
    const selectedObject = graph.select(event.target, mousePosition);
    if (event.altKey && selectedObject instanceof State) {
        selectedObject.toggleGoal();
    } else if (page.newEdgeButton.isPressed) {
        graph.startTemporaryEdge(event.target, mousePosition);
    }
}

function mousemoveGraph(event) {
    if (!graph.mouseIsDown) {
        return;
    }
    const mousePosition = graph.getMousePosition(event);
    if (page.newEdgeButton.isPressed) {
        graph.temporaryEdgeHeadTo(event.target, mousePosition);
    } else {
        graph.moveSelectedTo(mousePosition);
    }
}

function mouseupGraph(event) {
    graph.mouseIsDown = false;
    if (page.newEdgeButton.isPressed) {
        graph.setOrDeleteTemporaryEdge();
    }
    if (graph.selectedObject instanceof Edge) {
        graph.selectedObject.focusLabel();
    }
}

function mouseleaveGraph(event) {
    if (page.newEdgeButton.isPressed && graph.mouseIsDown) {
        graph.deleteTemporaryEdge();
    }
}

// ************************************************************************
// Edge Event Listeners
// ************************************************************************

function beginEdgeAnimate(event) {
    console.log('edge animation begin');
}

function endEdgeAnimate(event) {
    const edge = new Edge(event.target);
    if (edge.hasNoInputs()) {
        return;
    }
    console.log(`${edge.id()}: END edge animation`);
    console.log(`  Stored inputs: "${edge._storedInputsArray()}"`);
    edge.dumpInputsToHead();
    edge.head.animate();
}

function focusoutEdgeLabel(event) {
    event.target.style['user-select'] = 'none';
    event.target.style['-webkit-user-select'] = 'none';
}

function inputEdgeLabel(event) {
    const labelElement = event.target;
    labelElement.setAttributeNS(null, 'value', labelElement.value);
    labelElement.setAttributeNS(null, 'size', labelElement.value.length || 1);
    if (labelElement.value.length > 0) {
        labelElement.style.pointerEvents = 'auto';
    } else {
        labelElement.style.pointerEvents = 'none';
    }
    (new Edge(labelElement)).moveLabelTo();
}

// ************************************************************************
// State Event Listeners
// ************************************************************************

function beginStateAnimate(event) {
    graph.numberOfActiveStates++;
    graph.anInputWasAccepted = false;
    const state = new State(event.target);
    state.setLabelText(state.inputString(), 'orange', true);
}

function endStateAnimate(event) {
    const state = new State(event.target);
    state.setLabelText(state.labelValue());
    if (state.hasNoInputs()) {
        return;
    }
    console.log(`${state.id()}: END state animation`);
    console.log(`  Stored inputs: "${state._storedInputsArray()}"`);
    graph.numberOfActiveStates--;
    let input;
    while ((input = state.popInput())) {
        if (input === ' ' && state.isGoal()) {
            page.finishedInputLineAndAccept(true);
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
        page.finishedInputLineAndAccept(false);
    }
}

function dblclickState(event) {
    const state = new State(event.target);
    state.focusLabel();
}

function inputStateLabel(event) {
    const labelElement = event.target;
    const value = labelElement.value;
    labelElement.setAttributeNS(null, 'value', value);
    if (!event.dontStoreValue) {
        const stateElement = GraphMaker.baseStateElementFor(labelElement);
        stateElement.setAttributeNS(null, 'data-labelvalue', value);
    }
    let textOverflow = true;
    let fontSize = 25;
    while (textOverflow && fontSize > 1) {
        labelElement.style.fontSize = `${fontSize}px`;
        textOverflow = labelElement.scrollWidth > labelElement.clientWidth;
        fontSize -= 1;
    }
}
