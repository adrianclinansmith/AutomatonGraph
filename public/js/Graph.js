/* global GraphMaker State Edge */

// eslint-disable-next-line no-unused-vars
class Graph {
    // ************************************************************************
    // Constructor
    // ************************************************************************

    constructor(svg) {
        this.svg = svg;
        this.selectedObject = null;
        this.temporaryEdge = null;
        this.newStateAngle = Math.PI / -2;
        this.stateAnimateArray = [];
        this.edgeAnimateArray = [];
        this.inputs = [];
        this.currentLineNo = 0;
        this.acceptedAll = true;
        this.mouseIsDown = false;
    }

    // ************************************************************************
    // Instance
    // ************************************************************************

    addNewState(centerPosition) {
        const x = this.width() / 2 + 30 * Math.cos(this.newStateAngle);
        const y = this.height() - 5 - 30 * (2 + Math.sin(this.newStateAngle));
        this.newStateAngle += Math.PI / 2;
        if (Math.abs(this.newStateAngle - 3 * Math.PI / 2) < 0.01) {
            this.newStateAngle = Math.PI / -4;
        } else if (Math.abs(this.newStateAngle - 7 * Math.PI / 4) < 0.01) {
            this.newStateAngle = Math.PI / -2;
        }
        centerPosition = centerPosition || { x, y };
        const stategElement = GraphMaker.newStateElementAt(centerPosition);
        this.svg.appendChild(stategElement);
        const state = new State(stategElement);
        state.setLabelText(state.id());
        return state;
    }

    addToAnimateArray(stateOrEdge) {
        let animateArray = this.edgeAnimateArray;
        if (stateOrEdge instanceof State) {
            animateArray = this.stateAnimateArray;
        }
        if (!animateArray.find(obj => obj.equals(stateOrEdge))) {
            animateArray.push(stateOrEdge);
        }
    }

    removeFromAnimateArray(stateOrEdge) {
        if (stateOrEdge instanceof State) {
            let newArray = this.stateAnimateArray;
            newArray = newArray.filter(obj => !obj.equals(stateOrEdge));
            this.stateAnimateArray = newArray;
        } else {
            let newArray = this.edgeAnimateArray;
            newArray = newArray.filter(obj => !obj.equals(stateOrEdge));
            this.edgeAnimateArray = newArray;
        }
    }

    animateEdges() {
        this.edgeAnimateArray.forEach(edge => edge.animate());
    }

    animateStates() {
        this.stateAnimateArray.forEach(state => state.animate());
    }

    animateNextInput() {
        this.currentLineNo++;
        this.stopAnimation();
        return this.startAnimation();
    }

    deleteTemporaryEdge() {
        this.temporaryEdge?.remove();
        this.temporaryEdge = null;
    }

    deselect() {
        if (this.selectedObject instanceof Edge) {
            this.selectedObject.deselect();
        } else {
            this.selectedObject?.setColor('');
        }
        this.selectedObject = null;
    }

    getMousePosition(mouseEvent) {
        const CTM = self.svg.getScreenCTM();
        return {
            x: (mouseEvent.clientX - CTM.e) / CTM.a,
            y: (mouseEvent.clientY - CTM.f) / CTM.d
        };
    }

    height() {
        return this.svg.height.baseVal.value;
    }

    moveSelectedTo(position) {
        if (this.selectedObject instanceof State) {
            this.selectedObject.moveTo(position);
            return;
        }
        if (!(this.selectedObject instanceof Edge)) {
            return;
        }
        if (this.selectedObject.controlSelected) {
            this.selectedObject.moveControlTo(position);
        } else if (this.selectedObject.labelSelected) {
            this.selectedObject.moveLabelTo(position);
            console.log('label selected');
        }
    }

    select(element, atPosition) {
        this.deselect();
        const type = element.getAttribute('class');
        if (type === 'state') {
            this.selectedObject = new State(element);
            this.selectedObject.select(atPosition);
        } else if (type.startsWith('edge')) {
            this.selectedObject = new Edge(element);
            this.selectedObject.select(atPosition);
        }
        return this.selectedObject;
    }

    setOrDeleteTemporaryEdge() {
        if (this.temporaryEdge?.head) {
            this.selectedObject?.setColor('');
            this.selectedObject = this.temporaryEdge;
            this.selectedObject.tail?.addOutEdge(this.selectedObject);
            this.selectedObject.head.addInEdge(this.selectedObject);
            this.selectedObject.setLabelText('');
        } else {
            this.temporaryEdge?.remove();
        }
        this.temporaryEdge = null;
    }

    startAnimation() {
        if (this.currentLineNo >= this.inputs.length) {
            return -1;
        }
        let initialInput = this.inputs[this.currentLineNo];
        if (initialInput === '') {
            initialInput = ' ';
        }
        for (const initialEdge of this._allInitialEdges()) {
            if (initialEdge.consumeInput(initialInput)) {
                this.addToAnimateArray(initialEdge);
            }
        }
        this.animateEdges();
        return this.edgeAnimateArray.length;
    }

    startTemporaryEdge(element, position) {
        let edgegElement;
        if (element?.getAttribute('class') === 'state') {
            edgegElement = GraphMaker.newEdgeElementAt(new State(element));
        } else {
            edgegElement = GraphMaker.newEdgeElementAt(position);
        }
        this.svg.appendChild(edgegElement);
        this.temporaryEdge = new Edge(edgegElement);
        return this.temporaryEdge;
    }

    stopAnimation() {
        this.svg.unpauseAnimations();
        const allStatesAndEdges = [...this._allStates(), ...this._allEdges()];
        allStatesAndEdges.forEach(object => object.clearStoredInputs());
        const allAnimations = this.svg.querySelectorAll('.animate');
        allAnimations.forEach(animation => animation.endElement());
    }

    temporaryEdgeHeadTo(element, position) {
        if (element.getAttribute('class') === 'state') {
            this.temporaryEdge?.setHead(new State(element));
        } else {
            this.temporaryEdge?.setHead(position);
        }
    }

    width() {
        return this.svg.width.baseVal.value;
    }

    xmlBlob() {
        const xmlString = (new XMLSerializer()).serializeToString(this.svg);
        const imageType = 'image/svg+xml;charset=utf-8';
        return new Blob([xmlString], { type: imageType });
    }

    // ************************************************************************
    // Private
    // ************************************************************************

    _allEdges() {
        const selector = '.edge:not(#edge-template)';
        const edgeElements = this.svg.querySelectorAll(selector);
        return [...edgeElements].map(element => new Edge(element));
    }

    _allInitialEdges() {
        const selector = '.edge[data-tail=""]:not(#edge-template)';
        const initialEdgeElements = this.svg.querySelectorAll(selector);
        return [...initialEdgeElements].map(element => new Edge(element));
    }

    _allStates() {
        const selector = '.state:not(#state-template)';
        const stateElements = this.svg.querySelectorAll(selector);
        return [...stateElements].map(element => new State(element));
    }
}
