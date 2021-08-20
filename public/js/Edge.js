/* global pointAlongSlope State */
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
        let startPoint;
        if (place instanceof State) {
            startPoint = place.centerPosition();
            edgeElement.setAttributeNS(null, 'data-tail', place.id());
            edgeElement.setAttributeNS(null, 'data-head', place.id());
        } else {
            startPoint = place;
        }
        const { x, y } = startPoint;
        const dString = `M ${x},${y} Q ${x},${y} ${x},${y}`;
        console.log(`start point: (${startPoint.x}, ${startPoint.y})`);
        console.log(dString);
        edgeElement.setAttributeNS(null, 'd', dString);
        animateMotionElement.setAttributeNS(null, 'path', dString);
        foreignObjectElement.setAttributeNS(null, 'x', startPoint.x);
        foreignObjectElement.setAttributeNS(null, 'y', startPoint.y);
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
        } else if (elementOrId.getAttribute('class') === 'edge-g') {
            this.element = elementOrId.children[0];
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

    animateOnValidInput(input) {
        const edgeLabel = this._labelValue();
        const thisEdgeHasNoLabel = edgeLabel.length === 0;
        const inputIsAccepted = input.length > 0 && edgeLabel.includes(input[0]);
        if (thisEdgeHasNoLabel) {
            this._setDataInput(input);
            this._animateMotionElement().beginElement();
            return true;
        } else if (inputIsAccepted) {
            this._setDataInput(input.slice(1));
            this._animateMotionElement().beginElement();
            return true;
        } else {
            return false;
        }
    }

    focusLabel() {
        this._textInputElement().focus();
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    input() {
        return this.element.getAttributeNS(null, 'data-input');
    }

    remove() {
        this._gElement().remove();
    }

    resetForMovedState() {
        let startPoint;
        let endPoint;
        let controlPoint;
        const headPosition = this.head.centerPosition();
        if (this._isInitialEdge()) {
            const previousStart = this._dPoints().startPoint;
            const previousEnd = this._dPoints().endPoint;
            const startOffset = {};
            startOffset.x = previousStart.x - previousEnd.x + headPosition.x;
            startOffset.y = previousStart.y - previousEnd.y + headPosition.y;
            startPoint = pointAlongSlope(startOffset, headPosition, -37);
            endPoint = pointAlongSlope(headPosition, startPoint, 37);
        } else {
            startPoint = this._getStartPointForNewHead(this.head);
            endPoint = this._getEndPointForNewHead(this.head);
            controlPoint = this._getControlPointForNewHead(this.head);
        }
        this._setD(startPoint, endPoint, controlPoint);
        this._setLabelToControlPosition();
    }

    setColor(color) {
        this.element.style.stroke = color;
        const arrowUrl = 'url(#arrowhead' + (color ? `-${color})` : ')');
        this.element.setAttributeNS(null, 'marker-end', arrowUrl);
    }

    setHead(toPlace) {
        const startPoint = this._getStartPointForNewHead(toPlace);
        const endPoint = this._getEndPointForNewHead(toPlace);
        const controlPoint = this._getControlPointForNewHead(toPlace);
        this._setD(startPoint, endPoint, controlPoint);
        this._setLabelToControlPosition();
        if (toPlace instanceof State) {
            this.head = toPlace;
            this.element.setAttributeNS(null, 'data-head', toPlace.id());
        } else {
            this.head = null;
            this.element.setAttributeNS(null, 'data-head', '');
        }
    }

    setLabel(textString) {
        this._textInputElement().setAttributeNS(null, 'value', textString);
    }

    /* Private Instance */

    _animateMotionElement() {
        return this._gElement().children[2].children[0];
    }

    _dPoints() {
        // tail to head: <path d="M 100,250 Q 250,100 400,250" />
        // Initial edge: <path d="M 100,250 l 400,250" />
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

    _getControlPointForNewHead(newHead) {
        if (this.tail && this.tail.equals(newHead)) {
            const statePosition = newHead.centerPosition();
            return { x: statePosition.x, y: statePosition.y - 120 };
        }
        return undefined;
    }

    _getEndPointForNewHead(newHead) {
        if (!(newHead instanceof State)) {
            return newHead;
        } else if (newHead.equals(this.tail)) {
            const endPoint = newHead.pointOnPerimeter(-Math.PI / 4);
            return { x: endPoint.x, y: endPoint.y - 7 };
        }
        const radius = newHead.radius();
        const headPosition = newHead.centerPosition();
        let tailPosition;
        if (this.tail) {
            tailPosition = this.tail.centerPosition();
        } else {
            tailPosition = this._dPoints().startPoint;
        }
        return pointAlongSlope(headPosition, tailPosition, radius + 7);
    }

    _getStartPointForNewHead(newHead) {
        if (!this.tail) {
            return this._dPoints().startPoint;
        } else if (this.tail.equals(newHead)) {
            return newHead.pointOnPerimeter(-3 * Math.PI / 4);
        }
        const radius = this.tail.radius();
        const tailPosition = this.tail.centerPosition();
        let headPosition;
        if (newHead instanceof State) {
            headPosition = newHead.centerPosition();
        } else {
            headPosition = newHead;
        }
        return pointAlongSlope(tailPosition, headPosition, radius);
    }

    _isInitialEdge() {
        return !this.tail && this.head;
    }

    _isLoop() {
        return this.head?.equals(this.tail) === true;
    }

    _labelValue() {
        return this._textInputElement().value;
    }

    _setD(tailPosition, headPosition, controlPosition) {
        console.log(`crtl: ${controlPosition?.x}, ${controlPosition?.y}`);
        if (controlPosition === undefined) {
            console.log('yes undefined');
            controlPosition = {};
            controlPosition.x = (tailPosition.x + headPosition.x) / 2;
            controlPosition.y = (tailPosition.y + headPosition.y) / 2;
        }
        const tailString = `M ${tailPosition.x},${tailPosition.y}`;
        const controlString = ` Q ${controlPosition.x},${controlPosition.y}`;
        const headString = ` ${headPosition.x},${headPosition.y}`;
        const dString = tailString + controlString + headString;
        console.log(`d: ${dString}`);
        this.element.setAttributeNS(null, 'd', dString);
        this._animateMotionElement().setAttributeNS(null, 'path', dString);
    }

    _setDataInput(input) {
        this.element.setAttributeNS(null, 'data-input', input);
    }

    _setLabelToControlPosition() {
        const fo = this._foreignObjectElement();
        const controlPosition = this._dPoints().controlPoint;
        fo.setAttributeNS(null, 'x', controlPosition.x);
        fo.setAttributeNS(null, 'y', controlPosition.y);
    }

    _textInputElement() {
        return this._foreignObjectElement().children[0];
    }
}
