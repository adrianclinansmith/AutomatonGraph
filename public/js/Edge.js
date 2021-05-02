/* global State */
// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(place) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const element = document.createElementNS(xmlns, 'path');
        element.setAttributeNS(null, 'stroke', 'red');
        let startPosition;
        if (place instanceof State) {
            startPosition = place.centerPosition();
            element.setAttributeNS(null, 'data-tail', place.id());
        } else {
            startPosition = place;
        }
        const { x, y } = startPosition;
        const dString = `M ${x},${y} Q ${x},${y} ${x},${y}`;
        element.setAttributeNS(null, 'd', dString);
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

    headId() {
        return this.element.getAttributeNS(null, 'data-head');
    }

    positions() {
        // <path d="M 100,250 Q 250,100 400,250" />
        const dParts = this.element.getAttributeNS(null, 'd').split(' ');
        const tail = dParts[1].split(',');
        const crtl = dParts[3].split(',');
        const head = dParts[4].split(',');
        const tailPos = { x: parseFloat(tail[0]), y: parseFloat(tail[1]) };
        const crtlPos = { x: parseFloat(crtl[0]), y: parseFloat(crtl[1]) };
        const headPos = { x: parseFloat(head[0]), y: parseFloat(head[1]) };
        return { tail: tailPos, control: crtlPos, head: headPos };
    }

    remove() {
        this.element.remove();
    }

    setHead(place) {
        let newHeadPosition;
        if (place instanceof State) {
            this.element.setAttributeNS(null, 'data-head', place.id());
            newHeadPosition = place.centerPosition();
        } else {
            this.element.setAttributeNS(null, 'data-head', '');
            newHeadPosition = { x: place.x, y: place.y };
        }
        const tailPosition = this.positions().tail;
        const newControlX = (tailPosition.x + newHeadPosition.x) / 2;
        const newControlY = (tailPosition.y + newHeadPosition.y) / 2;
        const controlString = `Q ${newControlX},${newControlY}`;
        const headString = ` ${newHeadPosition.x},${newHeadPosition.y}`;
        const d = this.element.getAttributeNS(null, 'd');
        const qIndex = d.indexOf('Q');
        const dString = d.substring(0, qIndex) + controlString + headString;
        this.element.setAttributeNS(null, 'd', dString);
    }

    tailId() {
        return this.element.getAttributeNS(null, 'data-tail');
    }
}
