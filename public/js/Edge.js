/* global State */
// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(tail) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const element = document.createElementNS(xmlns, 'path');
        element.setAttributeNS(null, 'stroke', 'red');
        let startPosition;
        if (tail instanceof State) {
            startPosition = tail.centerPosition();
            element.setAttributeNS(null, 'data-tail', tail.id());
        } else {
            startPosition = tail;
        }
        const { x, y } = startPosition;
        element.setAttributeNS(null, 'd', `M ${x} ${y} L ${x} ${y}`);
        return element;
    }

    /* Constructor */

    constructor(edgeElement) {
        this.element = edgeElement;
        const tailId = edgeElement.getAttributeNS(null, 'data-tail');
        const headId = edgeElement.getAttributeNS(null, 'data-head');
        if (tailId) {
            this.tail = new State(document.getElementById(tailId));
        }
        if (tailId) {
            this.head = new State(document.getElementById(headId));
        }
    }

    /* Instance */

    setHead(position) {
        const headString = `L ${position.x} ${position.y}`;
        let tailPosition = this.endPositions().tailPosition;
        if (this.tail) {
            tailPosition = this.tail.centerPosition();
        }
        const tailString = `M ${tailPosition.x} ${tailPosition.y}`;
        this.element.setAttributeNS(null, 'd', `${tailString} ${headString}`);
    }

    endPositions() {
        const d = this.element.getAttributeNS(null, 'd');
        const dParts = d.split(' ');
        const tailPosition = { x: dParts[1], y: dParts[2] };
        const headPosition = { x: dParts[4], y: dParts[5] };
        return { tailPosition, headPosition };
    }
}
