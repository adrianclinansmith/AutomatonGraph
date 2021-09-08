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

    constructor(element) {
        const className = element.getAttribute('class');
        if (className === 'edge-g') {
            this.element = element.children[0];
        } else if (className === 'edge-control') {
            this.element = element.parentNode.children[0];
            this.controlSelected = true;
        } else if (element.classList.contains('edge-animate')) {
            this.element = element.parentNode.parentNode.children[0];
        } else if (className === 'edge-label') {
            this.element = element.parentNode.parentNode.children[0];
            this.labelSelected = true;
            this.labelOffset = { x: 0, y: 0 };
        } else {
            this.element = element;
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

    calculateControlDistance() {
        if (!this.head || !this.tail) {
            return;
        }
        const mid = this.head.pointBetween(this.tail);
        const axisOfSymmetry = this._axisOfSymmetry();
        const midOnAxis = Util.projectPointOntoLine(mid, axisOfSymmetry);
        const controlPoint = this._dPoints().controlPoint;
        return Util.distanceBetween(midOnAxis, controlPoint);
    }

    calculateControlIsForward() {
        if (!this.head || !this.tail) {
            return;
        }
        const basePoint = this._axisOfSymmetry().point;
        const controlPoint = this._dPoints().controlPoint;
        if (this.head.y < this.tail.y) {
            return controlPoint.x >= basePoint.x;
        } else if (this.head.y === this.tail.y && this.head.x > this.tail.x) {
            return controlPoint.y >= basePoint.y;
        } else if (this.head.y === this.tail.y && this.head.x < this.tail.x) {
            return controlPoint.y < basePoint.y;
        } else {
            return controlPoint.x <= basePoint.x;
        }
    }

    clearStoredInputs() {
        this.element.setAttributeNS(null, 'data-input', '');
    }

    consumeInput(input) {
        let acceptedValues = this._labelValuesArray();
        if (acceptedValues.length === 0) {
            acceptedValues = [''];
        }
        let didConsume = false;
        for (const value of acceptedValues) {
            if (input.startsWith(value)) {
                this._addInput(input.slice(value.length));
                didConsume = true;
            }
        }
        return didConsume;
    }

    dumpInputsToHead() {
        for (const input of this._storedInputsArray()) {
            this.head.addInput(input);
        }
        this.element.setAttributeNS(null, 'data-input', '');
    }

    deselect() {
        this.setColor('');
        const labelElement = this._labelElement();
        labelElement.style['user-select'] = 'none';
        labelElement.style['-webkit-user-select'] = 'none';
        this._controlElement().style.opacity = '0';
    }

    focusLabel() {
        const labelElement = this._labelElement();
        labelElement.style['user-select'] = 'all';
        labelElement.style['-webkit-user-select'] = 'all';
        labelElement.select();
    }

    hasNoInputs() {
        const dataInputs = this.element.getAttributeNS(null, 'data-input');
        return dataInputs === '';
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
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
        const vertex = Util.projectPointOntoLine(position, axisOfSymmetry);
        const d = this._dPoints();
        const base = Util.midpoint(d.startPoint, d.endPoint);
        const distance = Util.distanceBetween(base, vertex);
        const controlPoint = Util.goFromPointToPoint(vertex, base, -distance);
        const startPoint = this.tail.intersectTowards(controlPoint);
        const endPoint = this.head.intersectTowards(controlPoint, 7);
        this._setDAndPositionElements(startPoint, endPoint, controlPoint);
    }

    moveLabelTo(position) {
        const d = this._dPoints();
        position.x -= this.labelOffset.x;
        position.y -= this.labelOffset.y;
        const t = Util.fractionAlongLineSegment(position, d.startPoint, d.endPoint);
        if (t < 0 || t > 1) {
            return;
        }
        this.setLabelPosition(t);
    }

    // moveLabelTo0(position) {
    //     const { startPoint, controlPoint, endPoint } = this._dPoints();
    //     const co = Util.qbezierCoefficients(startPoint, controlPoint, endPoint);
    //     const m = this.labelSelectSlope;
    //     const a = co.ay - m * co.ax;
    //     const b = co.by - m * co.bx;
    //     const c = co.cy - m * co.cx + m * position.x - position.y;
    //     const t = Util.roots(a, b, c).filter(x => Util.isNumber(x)).map(x => Util.stayInInterval(x, 0, 1));
    //     let newPos;
    //     if (t.length === 2) {
    //         const pt1 = Util.qbezierPoint(startPoint, controlPoint, endPoint, t[0]);
    //         const pt2 = Util.qbezierPoint(startPoint, controlPoint, endPoint, t[1]);
    //         newPos = Util.closestPoint(position, pt1, pt2);
    //     } else if (t.length === 1) {
    //         newPos = Util.qbezierPoint(startPoint, controlPoint, endPoint, t[0]);
    //     } else {
    //         console.log(`NO VALID NUMBER t = ${t}`);
    //         return;
    //     }
    //     this._positionLabelAt(newPos);
    //     console.log(`t = ${t}, newPos:`);
    //     console.log(newPos);
    // }

    remove() {
        this._gElement().remove();
    }

    resetForMovedState(isForward, distance) {
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
            newD = this._calculatePointsForRegularEdge(isForward, distance);
        }
        this._setDAndPositionElements(newD.start, newD.end, newD.control);
    }

    select(atPosition) {
        this.setColor('red');
        this._controlElement().style.opacity = '1';
        if (this.labelOffset) {
            const labelPoint = this._labelPosition();
            const anchor = this._calculateLabelAnchor();
            const labelElement = this._labelElement();
            console.log(`anchor = ${anchor}, ${labelPoint.x}, ${atPosition.x}`);
            this.labelOffset.x = atPosition.x - labelPoint.x - anchor;
            this.labelOffset.y = atPosition.y - labelPoint.y;
            console.log(`label offset = ${this.labelOffset.x}`);
        }
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
            newD = this._calculatePointsForRegularEdge(true, 0);
        } else if (this.tail) {
            newD.start = this.tail.intersectTowards(toPlace);
            newD.end = toPlace;
        } else {
            newD.start = this._dPoints().startPoint;
            newD.end = toPlace;
        }
        this._setDAndPositionElements(newD.start, newD.end, newD.control);
    }

    setLabelText(textString) {
        const labelElement = this._labelElement();
        labelElement.setAttributeNS(null, 'value', textString);
        const event = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        labelElement.dispatchEvent(event);
    }

    setLabelPosition(t) {
        if (t === undefined) {
            t = Number(this.element.getAttributeNS(null, 'data-labelt'));
        }
        const position = this._pointOnCurve(t);
        const anchor = this._calculateLabelAnchor(t);
        const fo = this._foreignObjectElement();
        fo.setAttributeNS(null, 'x', position.x - anchor);
        fo.setAttributeNS(null, 'y', position.y);
        this.element.setAttributeNS(null, 'data-labelt', t);
    }

    /* Private Instance */

    _addInput(input) {
        input = input === '' ? ' ' : input;
        const storedInputs = this._storedInputsArray();
        if (storedInputs.includes(input)) {
            return;
        }
        storedInputs.push(input);
        const storedInputsString = Util.arrayToCsvString(storedInputs);
        this.element.setAttributeNS(null, 'data-input', storedInputsString);
    }

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

    _calculatePointsForLoop() {
        const start = this.tail.pointOnPerimeter(-3 * Math.PI / 4);
        const end = this.tail.pointOnPerimeter(-Math.PI / 4);
        end.y -= 7;
        const control = { x: this.tail.x, y: this.tail.y - 120 };
        return { start, end, control };
    }

    _calculatePointsForRegularEdge(forward, distance) {
        const axis = this._axisOfSymmetry();
        const downOrTrueLeft = Util.pointingDownOrTrueLeft(this.tail, this.head);
        if ((forward && downOrTrueLeft) || !(forward || downOrTrueLeft)) {
            distance *= -1;
        }
        const control = Util.pointAlongSlope(axis.point, axis.slope, distance);
        const start = this.tail.intersectTowards(control);
        const end = this.head.intersectTowards(control, 7);
        return { start, end, control };
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

    _isInitialEdge() {
        return !this.tail && this.head;
    }

    _isLoop() {
        return this.head && this.head.equals(this.tail);
    }

    _isRegularEdge() {
        return this.tail && this.head && !this.tail.equals(this.head);
    }

    _labelElement() {
        return this._foreignObjectElement().children[0];
    }

    _labelPosition() {
        const fo = this._foreignObjectElement();
        const x = fo.getAttributeNS(null, 'x');
        const y = fo.getAttributeNS(null, 'y');
        return { x, y };
    }

    // _labelt(t) {
    //     return Number(this.element.getAttributeNS(null, 'data-labelt'));
    // }

    // _setLabelt(t) {
    //     this.element.setAttributeNS(null, 'data-labelt', t);
    // }

    _labelValuesArray() {
        const labelValue = Util.removeWhitespace(this._labelElement().value);
        return Util.csvStringToArray(labelValue);
    }

    _positionControlElementAt(point) {
        const controlElement = this._controlElement();
        controlElement.setAttributeNS(null, 'cx', point.x);
        controlElement.setAttributeNS(null, 'cy', point.y);
    }

    _pointOnCurve(t) {
        const { startPoint, controlPoint, endPoint } = this._dPoints();
        return Util.qbezierPoint(startPoint, controlPoint, endPoint, t);
    }

    _calculateLabelAnchor(t) {
        const labelWidth = this._labelElement().clientWidth;
        // return labelWidth / 2;
        if (t === undefined) {
            t = Number(this.element.getAttributeNS(null, 'data-labelt'));
        }
        const { startPoint, controlPoint, endPoint } = this._dPoints();
        const m = Util.qbezierSlope(startPoint, controlPoint, endPoint, t);
        if (isNaN(m)) {
            console.log('~~~IS NAN~~~');
        }
        const anchor = labelWidth / 2 + labelWidth * m;
        return Util.stayInInterval(anchor, 0, labelWidth);
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
        this.setLabelPosition();
    }

    _storedInputsArray() {
        const dataInputs = this.element.getAttributeNS(null, 'data-input');
        return Util.csvStringToArray(dataInputs);
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
