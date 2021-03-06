/* global onEdgeLabelInput onEdgeLabelFocusOut onEdgeLabelDoubleClick
onEdgeLabelMouseDown Qbezier State Util */
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
        if (position === undefined) {
            this._setLabelAt();
            return;
        }
        const anchor = this._calculateLabelAnchor();
        position.x -= this.labelOffset.x - anchor;
        position.y -= this.labelOffset.y;
        const t = this._bezier().tClosestTo(position);
        console.log(`t = ${t}`);
        if (t >= 0 && t <= 1) {
            this._setLabelAt(t);
        }
    }

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
            this.labelOffset.x = atPosition.x - labelPoint.x;
            this.labelOffset.y = atPosition.y - labelPoint.y;
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

    _bezier() {
        const d = this._dPoints();
        return new Qbezier(d.startPoint, d.controlPoint, d.endPoint);
    }

    _calculateLabelAnchor(t) {
        if (t === undefined) {
            t = Number(this.element.getAttributeNS(null, 'data-labelt'));
        }
        const m = this._bezier().slopeAt(t);
        const labelWidth = this._labelElement().clientWidth;
        const anchor = labelWidth / 2 + labelWidth * m;
        return Util.stayInInterval(anchor, 0, labelWidth);
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
        const dString = this.element.getAttributeNS(null, 'd');
        const bezier = Qbezier.fromSvgPathString(dString);
        return { startPoint: bezier.p0, controlPoint: bezier.p1, endPoint: bezier.p2 };
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

    _labelValuesArray() {
        const labelValue = Util.removeWhitespace(this._labelElement().value);
        return Util.csvStringToArray(labelValue);
    }

    _positionControlElementAt(point) {
        const controlElement = this._controlElement();
        controlElement.setAttributeNS(null, 'cx', point.x);
        controlElement.setAttributeNS(null, 'cy', point.y);
    }

    _setDAndPositionElements(startPoint, endPoint, controlPoint) {
        const bezier = new Qbezier(startPoint, controlPoint, endPoint);
        const dString = bezier.svgPathString();
        this.element.setAttributeNS(null, 'd', dString);
        this._animateMotionElement().setAttributeNS(null, 'path', dString);
        const vertex = this._vertexPosition();
        this._positionControlElementAt(vertex);
        this._setLabelAt();
    }

    _setLabelAt(t) {
        if (t === undefined) {
            t = Number(this.element.getAttributeNS(null, 'data-labelt'));
        }
        const position = this._bezier().pointAt(t);
        const anchor = this._calculateLabelAnchor(t);
        const fo = this._foreignObjectElement();
        fo.setAttributeNS(null, 'x', position.x - anchor);
        fo.setAttributeNS(null, 'y', position.y);
        this.element.setAttributeNS(null, 'data-labelt', t);
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
