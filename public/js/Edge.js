/* global onEdgeLabelInput onEdgeLabelFocusOut onEdgeLabelDoubleClick
onEdgeLabelMouseDown State Util */
// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(place) {
        const template = document.getElementById('edge-g-template');
        const gElement = template.cloneNode(true);
        const edgeElement = gElement.children[0];
        const foreignObjectElement = gElement.children[1];
        const labelElement = foreignObjectElement.children[0];
        const animateMotionElement = gElement.children[3].children[0];
        gElement.setAttributeNS(null, 'id', '');
        let i = 0;
        while (document.getElementById(`e${i}`)) {
            i += 1;
        }
        edgeElement.setAttributeNS(null, 'id', `e${i}`);
        if (place instanceof State) {
            edgeElement.setAttributeNS(null, 'data-tail', place.id());
            edgeElement.setAttributeNS(null, 'data-head', place.id());
        }
        const { x, y } = place;
        const dString = `M ${x},${y} Q ${x},${y} ${x},${y}`;
        edgeElement.setAttributeNS(null, 'd', dString);
        animateMotionElement.setAttributeNS(null, 'path', dString);
        foreignObjectElement.setAttributeNS(null, 'x', x);
        foreignObjectElement.setAttributeNS(null, 'y', y);
        labelElement.oninput = onEdgeLabelInput;
        labelElement.ondblclick = onEdgeLabelDoubleClick;
        labelElement.onfocusout = onEdgeLabelFocusOut;
        labelElement.onmousedown = onEdgeLabelMouseDown;
        return gElement;
    }

    /* Constructor */

    constructor(elementOrId) {
        if (typeof elementOrId === 'string' || elementOrId instanceof String) {
            this.element = document.getElementById(elementOrId);
        } else if (elementOrId.getAttribute('class') === 'edge-g') {
            this.element = elementOrId.children[0];
        } else if (elementOrId.getAttribute('class') === 'edge-control') {
            this.element = elementOrId.parentNode.children[0];
            this.controlSelected = true;
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

    deselect() {
        this.setColor('');
        const labelElement = this._labelElement();
        labelElement.style['user-select'] = 'none';
        labelElement.style['-webkit-user-select'] = 'none';
    }

    focusLabel() {
        const labelElement = this._labelElement();
        labelElement.style['user-select'] = 'all';
        labelElement.style['-webkit-user-select'] = 'all';
        labelElement.select();
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    input() {
        return this.element.getAttributeNS(null, 'data-input');
    }

    moveControlTo(position) {
        if (this._isInitialEdge()) {
            const endpoint = this.head.intersectTowards(position, 7);
            this._setDAndPositionElements(position, endpoint);
            return;
        } else if (this._isLoop()) {
            return;
        }
        const axisOfSymmetry = this._axisOfSymmetry();
        const vertex = Util.pointOnLineClosestTo(position, axisOfSymmetry);
        const d = this._dPoints();
        const base = Util.midpoint(d.startPoint, d.endPoint);
        const distance = Util.distanceBetween(base, vertex);
        const controlPoint = Util.goFromPointToPoint(vertex, base, -distance);
        const startPoint = this.tail.intersectTowards(controlPoint);
        const endPoint = this.head.intersectTowards(controlPoint, 7);
        this._setDAndPositionElements(startPoint, endPoint, controlPoint);
        this._storeControlDistance();
        this._storeControlIsForward();
    }

    remove() {
        this._gElement().remove();
    }

    resetForMovedState() {
        let newD = {};
        if (this._isInitialEdge()) {
            const last = this._dPoints();
            const offset = {};
            offset.x = last.startPoint.x - last.endPoint.x + this.head.x;
            offset.y = last.startPoint.y - last.endPoint.y + this.head.y;
            newD.start = Util.goFromPointToPoint(offset, this.head, -37);
            newD.end = Util.goFromPointToPoint(this.head, newD.start, 37);
        } else if (this._isLoop()) {
            newD = this._calculatePointsForLoop();
        } else {
            newD = this._calculatePointsForRegularEdge();
        }
        this._setDAndPositionElements(newD.start, newD.end, newD.control);
    }

    setColor(color) {
        this.element.style.stroke = color;
        const controlElement = this._controlElement();
        controlElement.style.stroke = color;
        controlElement.style.fill = color;
        const arrowUrl = 'url(#arrowhead' + (color ? `-${color})` : ')');
        this.element.setAttributeNS(null, 'marker-end', arrowUrl);
    }

    setHead(toPlace) {
        if (toPlace instanceof State) {
            this.head = toPlace;
            this.element.setAttributeNS(null, 'data-head', toPlace.id());
        } else {
            this.head = null;
            this.element.setAttributeNS(null, 'data-head', '');
        }
        let newD = {};
        if (this._isInitialEdge()) {
            newD.start = this._dPoints().startPoint;
            newD.end = this.head.intersectTowards(newD.start, 7);
        } else if (this._isLoop()) {
            newD = this._calculatePointsForLoop();
        } else if (this._isRegularEdge()) {
            newD = this._calculatePointsForRegularEdge();
        } else if (this.tail) {
            newD.start = this.tail.intersectTowards(toPlace);
            newD.end = toPlace;
        } else {
            newD.start = this._dPoints().startPoint;
            newD.end = toPlace;
        }
        this._setDAndPositionElements(newD.start, newD.end, newD.control);
    }

    setLabel(textString) {
        const labelElement = this._labelElement();
        labelElement.setAttributeNS(null, 'value', textString);
        const event = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        labelElement.dispatchEvent(event);
    }

    select() {
        this.setColor('red');
    }

    /* Private Instance */

    _animateMotionElement() {
        return this._gElement().children[3].children[0];
    }

    _axisOfSymmetry() {
        const tailIntersect = this.tail.intersectTowards(this.head);
        const headIntersect = this.head.intersectTowards(this.tail, 7);
        const point = Util.midpoint(tailIntersect, headIntersect);
        const slope = -1 / Util.slopeBetween(this.head, this.tail);
        return { point, slope };
    }

    _controlElement() {
        return this._gElement().children[2];
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

    _getControlDistance() {
        const attribute = 'data-controldistance';
        return Number(this.element.getAttributeNS(null, attribute)) || 0;
    }

    _getControlIsForward() {
        return this.element.getAttributeNS(null, 'data-controlisforward');
    }

    _calculatePointsForLoop() {
        const start = this.tail.pointOnPerimeter(-3 * Math.PI / 4);
        const end = this.tail.pointOnPerimeter(-Math.PI / 4);
        end.y -= 7;
        const control = { x: this.tail.x, y: this.tail.y - 120 };
        return { start, end, control };
    }

    _calculatePointsForRegularEdge() {
        const axis = this._axisOfSymmetry();
        let distance = this._getControlDistance();
        const forward = this._getControlIsForward();
        const downOrTrueLeft = Util.pointingDownOrTrueLeft(this.tail, this.head);
        if ((forward && downOrTrueLeft) || !(forward || downOrTrueLeft)) {
            distance *= -1;
        }
        const control = Util.pointAlongSlope(axis.point, axis.slope, distance);
        const start = this.tail.intersectTowards(control);
        const end = this.head.intersectTowards(control, 7);
        return { start, end, control };
    }

    _isInitialEdge() {
        return !this.tail && this.head;
    }

    _isLoop() {
        return this.head && this.head.equals(this.tail);
    }

    _isRegularEdge() {
        return this.tail && this.head && !this.tail.equals(this.head);
    }

    _labelValue() {
        return this._labelElement().value;
    }

    _positionControlElementAt(point) {
        const controlElement = this._controlElement();
        controlElement.setAttributeNS(null, 'cx', point.x);
        controlElement.setAttributeNS(null, 'cy', point.y);
    }

    _positionLabelAt(point) {
        const fo = this._foreignObjectElement();
        fo.setAttributeNS(null, 'x', point.x);
        fo.setAttributeNS(null, 'y', point.y);
    }

    _setD(startPoint, endPoint, controlPoint) {
        if (controlPoint === undefined) {
            controlPoint = {};
            controlPoint.x = (startPoint.x + endPoint.x) / 2;
            controlPoint.y = (startPoint.y + endPoint.y) / 2;
        }
        const tailString = `M ${startPoint.x},${startPoint.y}`;
        const controlString = ` Q ${controlPoint.x},${controlPoint.y}`;
        const headString = ` ${endPoint.x},${endPoint.y}`;
        const dString = tailString + controlString + headString;
        this.element.setAttributeNS(null, 'd', dString);
        this._animateMotionElement().setAttributeNS(null, 'path', dString);
    }

    _setDAndPositionElements(startPoint, endPoint, controlPoint) {
        this._setD(startPoint, endPoint, controlPoint);
        const vertex = this._vertexPosition();
        this._positionControlElementAt(vertex);
        this._positionLabelAt(vertex);
    }

    _setDataInput(input) {
        this.element.setAttributeNS(null, 'data-input', input);
    }

    _storeControlDistance() {
        if (!this.head || !this.tail) {
            return;
        }
        const mid = this.head.pointBetween(this.tail);
        const axisOfSymmetry = this._axisOfSymmetry();
        const midOnAxis = Util.pointOnLineClosestTo(mid, axisOfSymmetry);
        const controlPoint = this._dPoints().controlPoint;
        const distance = Util.distanceBetween(midOnAxis, controlPoint);
        this.element.setAttributeNS(null, 'data-controldistance', distance);
    }

    _storeControlIsForward() {
        if (!this.head && !this.tail) {
            return;
        }
        const basePoint = this._axisOfSymmetry().point;
        const controlPoint = this._dPoints().controlPoint;
        let controlIsForward;
        if (this.head.y < this.tail.y) {
            controlIsForward = controlPoint.x >= basePoint.x;
        } else if (this.head.y === this.tail.y && this.head.x > this.tail.x) {
            controlIsForward = controlPoint.y >= basePoint.y;
        } else if (this.head.y === this.tail.y && this.head.x < this.tail.x) {
            controlIsForward = controlPoint.y < basePoint.y;
        } else {
            controlIsForward = controlPoint.x <= basePoint.x;
        }
        const result = controlIsForward ? 'true' : '';
        this.element.setAttributeNS(null, 'data-controlisforward', result);
    }

    _labelElement() {
        return this._foreignObjectElement().children[0];
    }

    _vertexPosition() {
        if (this._isInitialEdge()) {
            return this._dPoints().startPoint;
        }
        const d = this._dPoints();
        const basePoint = Util.midpoint(d.startPoint, d.endPoint);
        return Util.midpoint(basePoint, d.controlPoint);
    }
}
