/* global distanceBetween getPointTowards State midpoint slopeBetween
pointOnLineClosestTo pointAlongSlope pointAsString */
// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(place) {
        const template = document.getElementById('edge-g-template');
        const gElement = template.cloneNode(true);
        const edgeElement = gElement.children[0];
        const foreignObjectElement = gElement.children[1];
        const animateMotionElement = gElement.children[3].children[0];
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

    focusLabel() {
        this._textInputElement().focus();
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    input() {
        return this.element.getAttributeNS(null, 'data-input');
    }

    moveControlTo(position) {
        if (this._isInitialEdge()) {
            const head = this.head instanceof State ? this.head : this._dPoints().endPoint;
            const endpoints = this._calculateEndpointsFor(position, head);
            this._setD(endpoints.start, endpoints.end);
            this._setControlElementToControlPoint();
            this._setLabelToControlPoint();
            return;
        } else if (this._isLoop()) {
            return;
        }
        const axisOfSymmetry = this._axisOfSymmetry();
        const vertex = pointOnLineClosestTo(position, axisOfSymmetry);
        const d = this._dPoints();
        const midStartEnd = midpoint(d.startPoint, d.endPoint);
        const distance = distanceBetween(midStartEnd, vertex);
        const controlPoint = getPointTowards(vertex, midStartEnd, -distance);
        const startPoint = this.tail.intersectTowards(controlPoint);
        const endPoint = this.head.intersectTowards(controlPoint, 7);
        this._setD(startPoint, endPoint, controlPoint);
        this._setControlElementToControlPoint(vertex);
        this._setLabelToControlPoint(vertex);
        this._storeControlDistance();
        this._storeControlIsForward();
    }

    remove() {
        this._gElement().remove();
    }

    resetForMovedState() {
        let startPoint;
        let endPoint;
        let controlPoint;
        let vertex;
        if (this._isInitialEdge()) {
            const headPosition = this.head.centerPosition();
            const previousStart = this._dPoints().startPoint;
            const previousEnd = this._dPoints().endPoint;
            const startOffset = {};
            startOffset.x = previousStart.x - previousEnd.x + headPosition.x;
            startOffset.y = previousStart.y - previousEnd.y + headPosition.y;
            startPoint = getPointTowards(startOffset, headPosition, -37);
            endPoint = getPointTowards(headPosition, startPoint, 37);
        } else if (this._isLoop()) {
            const points = this._calculateEndpointsFor(this.tail, this.head);
            startPoint = points.start;
            endPoint = points.end;
            controlPoint = points.control;
        } else {
            const points = this._resetForMovedStateOfRegularEdge();
            startPoint = points.start;
            endPoint = points.end;
            controlPoint = points.control;
            const mid = midpoint(startPoint, endPoint);
            vertex = midpoint(mid, controlPoint);
            // console.log(`mid: ${pointAsString(mid)}`);
            // console.log(`control: ${pointAsString(controlPoint)}`);
            // console.log(`vetrex: ${pointAsString(vertex)}`);
        }
        this._setD(startPoint, endPoint, controlPoint);
        this._setControlElementToControlPoint(vertex);
        this._setLabelToControlPoint();
        // this._storeControlDistance();
    }

    setColor(color) {
        this.element.style.stroke = color;
        this._controlElement().style.stroke = color;
        this._controlElement().style.fill = color;
        const arrowUrl = 'url(#arrowhead' + (color ? `-${color})` : ')');
        this.element.setAttributeNS(null, 'marker-end', arrowUrl);
    }

    setHead(toPlace) {
        const tail = this.tail ? this.tail : this._dPoints().startPoint;
        const endpoints = this._calculateEndpointsFor(tail, toPlace);
        this._setD(endpoints.start, endpoints.end, endpoints.control);
        if (toPlace instanceof State) {
            this.head = toPlace;
            this.element.setAttributeNS(null, 'data-head', toPlace.id());
        } else {
            this.head = null;
            this.element.setAttributeNS(null, 'data-head', '');
        }
        this._setControlElementToControlPoint();
        this._setLabelToControlPoint();
        this._storeControlDistance();
    }

    setLabel(textString) {
        this._textInputElement().setAttributeNS(null, 'value', textString);
    }

    /* Private Instance */

    _animateMotionElement() {
        return this._gElement().children[3].children[0];
    }

    _axisOfSymmetry() {
        const tailIntersect = this.tail.intersectTowards(this.head);
        const headIntersect = this.head.intersectTowards(this.tail, 7);
        const point = midpoint(tailIntersect, headIntersect);
        const slope = -1 / slopeBetween(this.head, this.tail);
        return { point, slope };
    }

    // _axisOfSymmetry(newStart, newEnd) {
    //     const d = this._dPoints();
    //     let startPoint = newStart;
    //     let endPoint = newEnd;
    //     if (!startPoint) {
    //         startPoint = d.startPoint;
    //     }
    //     if (!endPoint) {
    //         endPoint = d.endPoint;
    //     }
    //     const point = midpoint(startPoint, endPoint);
    //     const slope = -1 / slopeBetween(startPoint, endPoint);
    //     return { point, slope };
    // }

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
        return this.element.getAttributeNS(null, 'data-controldistance');
    }

    _getControlIsForward() {
        return this.element.getAttributeNS(null, 'data-controlisforward');
    }

    _calculateEndpointsFor(newTail, newHead) {
        let start, end, control;
        if (newTail instanceof State && newTail.equals(newHead)) {
            start = newHead.pointOnPerimeter(-3 * Math.PI / 4);
            end = newHead.pointOnPerimeter(-Math.PI / 4);
            const statePosition = newTail.centerPosition();
            control = { x: statePosition.x, y: statePosition.y - 120 };
            end.y -= 7;
            return { start, end, control };
        }
        start = newTail instanceof State ? newTail.centerPosition() : newTail;
        end = newHead instanceof State ? newHead.centerPosition() : newHead;
        if (newTail instanceof State) {
            start = getPointTowards(start, end, 30);
        }
        if (newHead instanceof State) {
            end = getPointTowards(end, start, 37);
        }
        return { start, end };
    }

    _isInitialEdge() {
        return !this.tail && this.head;
    }

    _isLoop() {
        return this.head && this.head.equals(this.tail);
    }

    _labelValue() {
        return this._textInputElement().value;
    }

    _pointOnAxisBetweenHeadAndTail() {
        const betweenHeadAndTail = this.head.pointBetween(this.tail);
        const axisOfSymmetry = this._axisOfSymmetry();
        return pointOnLineClosestTo(betweenHeadAndTail, axisOfSymmetry);
    }

    _resetForMovedStateOfRegularEdge() {
        const axisSlope = this._axisOfSymmetry().slope;
        const basePoint = this._pointOnAxisBetweenHeadAndTail();
        let distance = this._getControlDistance();
        const isForward = this._getControlIsForward();
        const tail = this.tail;
        const head = this.head;
        const headIsbelowOrLeft = head.y > tail.y || (head.y === tail.y && head.x < tail.x);
        if ((isForward && headIsbelowOrLeft) || !(isForward || headIsbelowOrLeft)) {
            distance *= -1;
        }
        const control = pointAlongSlope(basePoint, axisSlope, distance);
        const start = this.tail.intersectTowards(control);
        const end = this.head.intersectTowards(control, 7);
        return { start, end, control };
    }

    _setControlElementToControlPoint(controlPoint) {
        let position;
        if (this._isInitialEdge()) {
            position = this._dPoints().startPoint;
        } else if (controlPoint) {
            position = controlPoint;
        } else {
            position = this._dPoints().controlPoint;
        }
        const controlElement = this._controlElement();
        controlElement.setAttributeNS(null, 'cx', position.x);
        controlElement.setAttributeNS(null, 'cy', position.y);
    }

    _setD(tailPosition, headPosition, controlPosition) {
        if (controlPosition === undefined) {
            controlPosition = {};
            controlPosition.x = (tailPosition.x + headPosition.x) / 2;
            controlPosition.y = (tailPosition.y + headPosition.y) / 2;
        }
        const tailString = `M ${tailPosition.x},${tailPosition.y}`;
        const controlString = ` Q ${controlPosition.x},${controlPosition.y}`;
        const headString = ` ${headPosition.x},${headPosition.y}`;
        const dString = tailString + controlString + headString;
        this.element.setAttributeNS(null, 'd', dString);
        this._animateMotionElement().setAttributeNS(null, 'path', dString);
    }

    _setDataInput(input) {
        this.element.setAttributeNS(null, 'data-input', input);
    }

    _setLabelToControlPoint(controlPoint) {
        const fo = this._foreignObjectElement();
        let controlPosition;
        if (controlPoint) {
            controlPosition = controlPoint;
        } else {
            controlPosition = this._dPoints().controlPoint;
        }
        fo.setAttributeNS(null, 'x', controlPosition.x);
        fo.setAttributeNS(null, 'y', controlPosition.y);
    }

    _storeControlDistance() {
        if (!this.head || !this.tail) {
            return;
        }
        const mid = this.head.pointBetween(this.tail);
        const axisOfSymmetry = this._axisOfSymmetry();
        const midOnAxis = pointOnLineClosestTo(mid, axisOfSymmetry);
        const controlPoint = this._dPoints().controlPoint;
        const distance = distanceBetween(midOnAxis, controlPoint);
        this.element.setAttributeNS(null, 'data-controldistance', distance);
    }

    _storeControlIsForward() {
        if (!this.head && !this.tail) {
            return;
        }
        const basePoint = this._pointOnAxisBetweenHeadAndTail();
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

    _textInputElement() {
        return this._foreignObjectElement().children[0];
    }
}
