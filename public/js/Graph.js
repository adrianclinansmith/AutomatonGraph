/* global State Edge */

// eslint-disable-next-line no-unused-vars
class Graph {
    /* Constructor */
    constructor(svg) {
        this.svg = svg;
        this.xmlns = 'http://www.w3.org/2000/svg';
        this.selectedObject = null;
        this.temporaryEdge = null;
        this.angle = Math.PI / -2;
        this.selectedPositionOffset = { x: 0, y: 0 };
    }

    /* Instance */

    addNewState() {
        const x = this.width() / 2 + 30 * Math.cos(this.angle);
        const y = this.height() - 5 - 30 * (2 + Math.sin(this.angle));
        this.angle += Math.PI / 2;
        if (Math.abs(this.angle - 3 * Math.PI / 2) < 0.01) {
            this.angle = Math.PI / -4;
        } else if (Math.abs(this.angle - 7 * Math.PI / 4) < 0.01) {
            this.angle = Math.PI / -2;
        }
        const stategElement = State.createElementAt({ x, y });
        this.svg.appendChild(stategElement);
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
        if (this.selectedObject instanceof State) {
            this.selectedObject.setStrokeColor('black');
        }
        this.selectedObject = null;
        if (element.getAttribute('class') === 'state') {
            this.selectedObject = new State(element);
            this.selectedObject.setPositionOffset(atPosition);
            this.selectedObject.setStrokeColor('red');
        }
    }

    startTemporaryEdge(element, position) {
        let edgeElement;
        if (this.selectedObject instanceof State) {
            edgeElement = Edge.createElementAt(this.selectedObject);
        } else {
            edgeElement = Edge.createElementAt(position);
        }
        this.svg.appendChild(edgeElement);
        this.temporaryEdge = new Edge(edgeElement);
    }

    temporaryEdgeHeadTo(element, position) {
        this.temporaryEdge.setHead(position);
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
