/* global State */
// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(place) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const element = document.createElementNS(xmlns, 'path');
        element.setAttributeNS(null, 'stroke', 'red');
        element.setAttributeNS(null, 'marker-end', 'url(#arrowhead)');
        let i = 0;
        while (document.getElementById(`e${i}`)) {
            i += 1;
        }
        element.setAttributeNS(null, 'id', `e${i}`);
        let startPosition;
        if (place instanceof State) {
            startPosition = place.centerPosition();
            element.setAttributeNS(null, 'data-tail', place.id());
            element.setAttributeNS(null, 'data-head', place.id());
        } else {
            startPosition = place;
        }
        const { x, y } = startPosition;
        const dString = `M ${x},${y} Q ${x},${y} ${x},${y}`;
        element.setAttributeNS(null, 'd', dString);
        return element;
    }

    /* Constructor */

    constructor(elementOrId) {
        if (typeof elementOrId === 'string' || elementOrId instanceof String) {
            this.element = document.getElementById(elementOrId);
        } else {
            this.element = elementOrId;
        }
        const tailId = this.element.getAttributeNS(null, 'data-tail');
        const headId = this.element.getAttributeNS(null, 'data-head');
        if (tailId) {
            this.tail = new State(document.getElementById(tailId));
        }
        if (headId) {
            this.head = new State(document.getElementById(headId));
        }
    }

    /* Instance */

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    isValidEdge() {
        return this.tail && this.head;
    }

    remove() {
        this.element.remove();
    }

    reset() {
        this._setLine(this.tail.centerPosition(), this.head.centerPosition());
    }

    setHead(place) {
        const tailPosition = this._positions().tailPosition;
        if (place instanceof State) {
            this.head = place;
            this.element.setAttributeNS(null, 'data-head', place.id());
            this._setLine(tailPosition, place.centerPosition());
        } else {
            this.head = null;
            this.element.setAttributeNS(null, 'data-head', '');
            this._setLine(tailPosition, place);
        }
    }

    /* Private Instance */

    _positions() {
        // <path d="M 100,250 Q 250,100 400,250" />
        const dParts = this.element.getAttributeNS(null, 'd').split(' ');
        const tailString = dParts[1].split(',');
        const controlString = dParts[3].split(',');
        const headString = dParts[4].split(',');
        const tailPosition = {
            x: parseFloat(tailString[0]),
            y: parseFloat(tailString[1])
        };
        const controlPosition = {
            x: parseFloat(controlString[0]),
            y: parseFloat(controlString[1])
        };
        const headPosition = {
            x: parseFloat(headString[0]),
            y: parseFloat(headString[1])
        };
        return { tailPosition, controlPosition, headPosition };
    }

    _setLine(tailPosition, headPosition) {
        const control = {};
        control.x = (tailPosition.x + headPosition.x) / 2;
        control.y = (tailPosition.y + headPosition.y) / 2;
        const tailString = `M ${tailPosition.x},${tailPosition.y}`;
        const controlString = ` Q ${control.x},${control.y}`;
        const headString = ` ${headPosition.x},${headPosition.y}`;
        const dString = tailString + controlString + headString;
        this.element.setAttributeNS(null, 'd', dString);
    }
}
