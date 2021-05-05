/* global State Edge */

// eslint-disable-next-line no-unused-vars
class Graph {
    /* Constructor */
    constructor(svg) {
        this.svg = svg;
        this.selectedObject = null;
        this.temporaryEdge = null;
        this.newStateAngle = Math.PI / -2;
    }

    /* Instance */

    addNewState() {
        const x = this.width() / 2 + 30 * Math.cos(this.newStateAngle);
        const y = this.height() - 5 - 30 * (2 + Math.sin(this.newStateAngle));
        this.newStateAngle += Math.PI / 2;
        if (Math.abs(this.newStateAngle - 3 * Math.PI / 2) < 0.01) {
            this.newStateAngle = Math.PI / -4;
        } else if (Math.abs(this.newStateAngle - 7 * Math.PI / 4) < 0.01) {
            this.newStateAngle = Math.PI / -2;
        }
        const stategElement = State.createElementAt({ x, y });
        this.svg.appendChild(stategElement);
    }

    deleteTemporaryEdge() {
        this.temporaryEdge?.remove();
        this.temporaryEdge = null;
    }

    height() {
        return this.svg.height.baseVal.value;
    }

    moveSelectedTo(position) {
        if (this.selectedObject instanceof State) {
            this.selectedObject.moveTo(position);
        }
    }

    select(element, atPosition) {
        this.selectedObject?.setColor('');
        this.selectedObject = null;
        if (element.getAttribute('class') === 'state') {
            this.selectedObject = new State(element);
            this.selectedObject.setColor('red');
            this.selectedObject.setPositionOffset(atPosition);
        } else if (element.getAttribute('class') === 'edge') {
            this.selectedObject = new Edge(element);
            this.selectedObject.setColor('red');
        }
    }

    setOrDeleteTemporaryEdge() {
        if (this.temporaryEdge?.isValidEdge()) {
            this.selectedObject?.setColor('');
            this.selectedObject = this.temporaryEdge;
            this.selectedObject.tail.addOutEdge(this.selectedObject);
            this.selectedObject.head.addInEdge(this.selectedObject);
        } else {
            this.temporaryEdge?.remove();
        }
        this.temporaryEdge = null;
    }

    startTemporaryEdge(element, position) {
        let edgegElement;
        if (element.getAttribute('class') === 'state') {
            edgegElement = Edge.createElementAt(new State(element));
        } else {
            edgegElement = Edge.createElementAt(position);
        }
        this.svg.appendChild(edgegElement);
        this.temporaryEdge = new Edge(edgegElement.children[0]);
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
}
