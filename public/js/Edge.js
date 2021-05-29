/* global State */
// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(place) {
        const template = document.getElementById('edge-g-template');
        const gElement = template.cloneNode(true);
        const edgeElement = gElement.children[0];
        const foreignObjectElement = gElement.children[1];
        const animateMotionElement = gElement.children[2].children[0];
        gElement.setAttributeNS(null, 'id', '');
        let i = 0;
        while (document.getElementById(`e${i}`)) {
            i += 1;
        }
        edgeElement.setAttributeNS(null, 'id', `e${i}`);
        let startPosition;
        if (place instanceof State) {
            startPosition = place.centerPosition();
            edgeElement.setAttributeNS(null, 'data-tail', place.id());
            edgeElement.setAttributeNS(null, 'data-head', place.id());
        } else {
            startPosition = place;
        }
        const { x, y } = startPosition;
        const dString = `M ${x},${y} Q ${x},${y} ${x},${y}`;
        edgeElement.setAttributeNS(null, 'd', dString);
        animateMotionElement.setAttributeNS(null, 'path', dString);
        foreignObjectElement.setAttributeNS(null, 'x', startPosition.x);
        foreignObjectElement.setAttributeNS(null, 'y', startPosition.y);
        Edge.setLabelCallback(edgeElement);
        return gElement;
    }

    static setLabelCallback(edgeElement) {
        const label = edgeElement.parentNode.children[1].children[0];
        label.oninput = function(event) {
            event.target.setAttributeNS(null, 'value', event.target.value);
        };
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

    animate() {
        this._animateMotionElement().beginElement();
    }

    focusLabel() {
        console.log(this._textInputElement());
        this._textInputElement().focus();
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    isValidEdge() {
        return this.head && this.head.id() !== this.tail?.id();
    }

    remove() {
        this._gElement().remove();
    }

    resetForMovedState() {
        let startPoint;
        let endPoint = this.head.centerPosition();
        if (this._isStartState()) {
            const previousStart = this._dPoints().startPoint;
            const previousEnd = this._dPoints().endPoint;
            startPoint = {};
            startPoint.x = endPoint.x - previousEnd.x + previousStart.x;
            startPoint.y = endPoint.y - previousEnd.y + previousStart.y;
            startPoint = this._pointAlongSlope(startPoint, endPoint, -37);
            endPoint = this._pointAlongSlope(endPoint, startPoint, 37);
        } else {
            startPoint = this.tail.centerPosition();
            endPoint = this._pointAlongSlope(endPoint, startPoint, 37);
        }
        this._setD(startPoint, endPoint);
        this._setLabelToControlPosition();
    }

    setColor(color) {
        this.element.style.stroke = color;
        const arrowUrl = 'url(#arrowhead' + (color ? `-${color})` : ')');
        this.element.setAttributeNS(null, 'marker-end', arrowUrl);
    }

    setHead(toPlace) {
        const startPoint = this._dPoints().startPoint;
        let endPoint = toPlace;
        if (toPlace instanceof State) {
            this.head = toPlace;
            const headPosition = this.head.centerPosition();
            endPoint = this._pointAlongSlope(headPosition, startPoint, 37);
            this.element.setAttributeNS(null, 'data-head', toPlace.id());
        } else {
            this.head = null;
            this.element.setAttributeNS(null, 'data-head', '');
        }
        this._setD(startPoint, endPoint);
        this._setLabelToControlPosition();
    }

    /* Private Instance */

    _animateMotionElement() {
        return this._gElement().children[2].children[0];
    }

    _dPoints() {
        // tail to head: <path d="M 100,250 Q 250,100 400,250" />
        // start edge:  <path d="M 100,250 l 400,250" />
        const dParts = this.element.getAttributeNS(null, 'd').split(' ');
        const startString = dParts[1].split(',');
        const controlString = dParts[3].split(',');
        const endString = dParts[4].split(',');
        const startPoint = {
            x: parseFloat(startString[0]),
            y: parseFloat(startString[1])
        };
        const controlPoint = {
            x: parseFloat(controlString[0]),
            y: parseFloat(controlString[1])
        };
        const endPoint = {
            x: parseFloat(endString[0]),
            y: parseFloat(endString[1])
        };
        return { startPoint, controlPoint, endPoint };
    }

    _foreignObjectElement() {
        return this._gElement().children[1];
    }

    _gElement() {
        return this.element.parentNode;
    }

    _pointAlongSlope(fromPoint, toPoint, distance) {
        if (this._isPointingleftOrStraightUp(fromPoint, toPoint)) {
            distance *= -1;
        }
        const m = this._slope(toPoint, fromPoint);
        if (!Number.isFinite(m)) {
            return { x: fromPoint.x, y: fromPoint.y + distance };
        }
        const d = distance * Math.sqrt(1 / (1 + m * m));
        const x = fromPoint.x + d;
        const y = fromPoint.y + m * d;
        return { x, y };
    }

    _isStartState() {
        return !this.tail && this.head;
    }

    _isPointingleftOrStraightUp(tailPosition, headPosition) {
        if (headPosition.x === tailPosition.x) {
            return headPosition.y < tailPosition.y;
        }
        return headPosition.x < tailPosition.x;
    }

    _setD(tailPosition, headPosition, calculateIntersect = true) {
        // if (this.head && calculateIntersect) {
        //     headPosition = this._headIntersect(tailPosition);
        // }
        const control = {};
        control.x = (tailPosition.x + headPosition.x) / 2;
        control.y = (tailPosition.y + headPosition.y) / 2;
        const tailString = `M ${tailPosition.x},${tailPosition.y}`;
        const controlString = ` Q ${control.x},${control.y}`;
        const headString = ` ${headPosition.x},${headPosition.y}`;
        const dString = tailString + controlString + headString;
        this.element.setAttributeNS(null, 'd', dString);
        this._animateMotionElement().setAttributeNS(null, 'path', dString);
    }

    _setLabelToControlPosition() {
        const fo = this._foreignObjectElement();
        const controlPosition = this._dPoints().controlPoint;
        fo.setAttributeNS(null, 'x', controlPosition.x);
        fo.setAttributeNS(null, 'y', controlPosition.y);
    }

    _slope(startpoint, endpoint) {
        return (endpoint.y - startpoint.y) / (endpoint.x - startpoint.x);
    }

    _textInputElement() {
        return this._foreignObjectElement().children[0];
    }
}
