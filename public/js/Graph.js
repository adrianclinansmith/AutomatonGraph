/* global State Edge */

// eslint-disable-next-line no-unused-vars
class Graph {
    /* Constructor */
    constructor(svg) {
        this.svg = svg;
        this.selectedObject = null;
        this.temporaryEdge = null;
        this.newStateAngle = Math.PI / -2;
        this.animationShouldPlay = false;
        this.activeStates = 0;
        this.inputs = [];
        this.currentLineNo = 0;
        this.acceptedAll = true;
    }

    /* Instance */

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
        const stategElement = State.createElementAt(centerPosition);
        this.svg.appendChild(stategElement);
        return new State(stategElement);
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
        this.selectedObject?.setColor('');
        this.selectedObject = null;
    }

    height() {
        return this.svg.height.baseVal.value;
    }

    moveSelectedTo(position) {
        if (this.selectedObject instanceof State) {
            this.selectedObject.moveTo(position);
        } else if (this.selectedObject instanceof Edge &&
                   this.selectedObject.controlSelected) {
            this.selectedObject.moveControlTo(position);
        }
    }

    select(element, atPosition) {
        this.deselect();
        if (element.getAttribute('class') === 'state') {
            this.selectedObject = new State(element);
            this.selectedObject.setColor('red');
            this.selectedObject.setPositionOffset(atPosition);
        } else if (element.getAttribute('class').startsWith('edge')) {
            this.selectedObject = new Edge(element);
            this.selectedObject.setColor('red');
        }
        return this.selectedObject;
    }

    setOrDeleteTemporaryEdge() {
        if (this.temporaryEdge?.head) {
            this.selectedObject?.setColor('');
            this.selectedObject = this.temporaryEdge;
            this.selectedObject.tail?.addOutEdge(this.selectedObject);
            this.selectedObject.head.addInEdge(this.selectedObject);
        } else {
            this.temporaryEdge?.remove();
        }
        this.temporaryEdge = null;
    }

    startAnimation() {
        if (this.currentLineNo >= this.inputs.length) {
            return false;
        }
        const currentInput = this.inputs[this.currentLineNo];
        console.log('current input: ' + currentInput);
        this.animationShouldPlay = true;
        this.activeStates = 0;
        const initialEdgeArray = this._allInitialEdges();
        for (const initialEdge of initialEdgeArray) {
            const wasAccepted = initialEdge.animateOnValidInput(currentInput);
            if (wasAccepted) {
                this.activeStates++;
            }
        }
        return true;
    }

    startTemporaryEdge(element, position) {
        let edgegElement;
        if (element?.getAttribute('class') === 'state') {
            edgegElement = Edge.createElementAt(new State(element));
        } else {
            edgegElement = Edge.createElementAt(position);
        }
        this.svg.appendChild(edgegElement);
        this.temporaryEdge = new Edge(edgegElement.children[0]);
        return new Edge(edgegElement);
    }

    stopAnimation() {
        this.animationShouldPlay = false;
        const animations = document.getElementsByClassName('animate');
        for (const animation of animations) {
            animation.endElement();
            // animation.pauseElement();
        }
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

    /* Private */

    _allInitialEdges() {
        const initialEdgeElements = this.svg.querySelectorAll('.edge');
        const initialEdgeObjects = [];
        for (const element of initialEdgeElements) {
            if (element.id !== 'edge-template' &&
                !element.getAttribute('data-tail')) {
                const object = new Edge(element);
                initialEdgeObjects.push(object);
            }
        }
        return initialEdgeObjects;
    }
}
