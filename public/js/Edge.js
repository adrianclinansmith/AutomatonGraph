/* global GraphMaker Qbezier State Util */
// eslint-disable-next-line no-unused-vars
class Edge {
    // ************************************************************************
    // Constructor
    // ************************************************************************

    constructor(element) {
        this.element = GraphMaker.baseEdgeElementFor(element);
        const selectedClass = element.getAttribute('class');
        this.labelSelected = (selectedClass === 'edge-label');
        this.controlSelected = (selectedClass === 'edge-control');
        this.labelOffset = { x: 0, y: 0 };
        const tailId = this.element.getAttributeNS(null, 'data-tail');
        const headId = this.element.getAttributeNS(null, 'data-head');
        if (tailId) {
            this.tail = new State(document.getElementById(tailId));
        }
        if (headId) {
            this.head = new State(document.getElementById(headId));
        }
    }

    // ************************************************************************
    // Public methods
    // ************************************************************************

    animate() {
        this._animateMotionElement().beginElement();
    }

    calculateP1Height() {
        if (!this.head || !this.tail) {
            return;
        }
        const mid = this.head.pointBetween(this.tail);
        const axisOfSymmetry = this._axisOfSymmetry();
        const midOnAxis = Util.projectPointOntoLine(mid, axisOfSymmetry);
        return Util.distanceBetween(midOnAxis, this._bezier().p1);
    }

    calculateP1IsForward() {
        if (!this.head || !this.tail) {
            return;
        }
        const basePoint = this._axisOfSymmetry().point;
        const controlPoint = this._bezier().p1;
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

    equals(otherEdge) {
        return otherEdge instanceof Edge && otherEdge.id() === this.id();
    }

    focusLabel() {
        const labelElement = this._labelElement();
        labelElement.style['user-select'] = 'all';
        labelElement.style['-webkit-user-select'] = 'all';
        labelElement.select();
    }

    hasNoInputs() {
        return this.element.getAttributeNS(null, 'data-input') === '';
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    labelValue() {
        return this._labelElement().value;
    }

    moveControlTo(point) {
        if (this._isInitialEdge()) {
            const p02 = this.head.intersectTowards(point, 7);
            this._setDAndPositionElements(point, undefined, p02);
            return;
        } else if (this._isLoop()) {
            return;
        }
        const bezier = this._bezier();
        const base = Util.midpoint(bezier.p0, bezier.p2);
        const axisOfSymmetry = this._axisOfSymmetry();
        const newVertex = Util.projectPointOntoLine(point, axisOfSymmetry);
        const newHeight = Util.distanceBetween(base, newVertex);
        const oldHeight = Util.distanceBetween(base, bezier.p1);
        let p1;
        if ((newHeight > oldHeight && newHeight > 8) ||
            (newHeight < oldHeight && newHeight > 2)) {
            p1 = Util.goFromPointToPoint(newVertex, base, -newHeight);
        }
        const p0 = this.tail.intersectTowards(p1 || this.head);
        const p2 = this.head.intersectTowards(p1 || this.tail, 7);
        this._setDAndPositionElements(p0, p1, p2);
    }

    moveLabelTo(point) {
        let t = Number(this.element.getAttributeNS(null, 'data-labelt'));
        if (point === undefined) {
            this._setLabelAt(t);
            return;
        }
        const applyBottomAnchor = this._bezier().pointIsDownOrBelowAt(t, point);
        console.log(`h t: ${this._bezier().horizontalT()}`);
        const anchor = this._calculateLabelAnchor(t, applyBottomAnchor);
        point.x -= this.labelOffset.x - anchor.x;
        point.y -= this.labelOffset.y - anchor.y;
        t = this._bezier().tClosestTo(point);
        t = Util.within(t, 0, 1);
        if (this._isLoop() && t > 0.3 && t < 0.730) {
            this._setLabelAt(0.515, applyBottomAnchor);
        } else {
            this._setLabelAt(t, applyBottomAnchor);
        }
    }

    remove() {
        this.head?.removeInEdge(this);
        if (!this._isInitialEdge()) {
            this.tail?.removeOutEdge(this);
        }
        this._gElement().remove();
    }

    resetForMovedState(isForward, distance) {
        let newD = {};
        if (this._isInitialEdge()) {
            const oldBezier = this._bezier();
            const offset = {};
            offset.x = oldBezier.p0.x - oldBezier.p2.x + this.head.x;
            offset.y = oldBezier.p0.y - oldBezier.p2.y + this.head.y;
            newD.p0 = Util.goFromPointToPoint(offset, this.head, -37);
            newD.p2 = Util.goFromPointToPoint(this.head, newD.p0, 37);
        } else if (this._isLoop()) {
            newD = this.tail.calculateLoopEdgePoints();
        } else {
            newD = this._calculatePointsForRegularEdge(isForward, distance);
        }
        this._setDAndPositionElements(newD.p0, newD.p1, newD.p2);
    }

    select(atPosition) {
        this.setColor('red');
        if (!this._isLoop()) {
            this._controlElement().style.opacity = '1';
        }
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
            newD.p0 = this._bezier().p0;
            newD.p2 = this.head.intersectTowards(newD.p0, 7);
        } else if (this._isLoop()) {
            newD = this.tail.calculateLoopEdgePoints();
        } else if (this._isRegularEdge()) {
            newD = this._calculatePointsForRegularEdge(true, 0);
        } else if (this.tail) {
            newD.p0 = this.tail.intersectTowards(toPlace);
            newD.p2 = toPlace;
        } else {
            newD.p0 = this._bezier().p0;
            newD.p2 = toPlace;
        }
        this._setDAndPositionElements(newD.p0, newD.p1, newD.p2);
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

    // ************************************************************************
    // Private Methods
    // ************************************************************************

    _addInput(input) {
        input = input === '' ? ' ' : input;
        const storedInputsArray = this._storedInputsArray();
        if (!storedInputsArray.includes(input)) {
            storedInputsArray.push(input);
            const csvString = Util.arrayToCsvString(storedInputsArray);
            this.element.setAttributeNS(null, 'data-input', csvString);
        }
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
        const d = this.element.getAttributeNS(null, 'd');
        return Qbezier.fromSvgPathString(d);
    }

    _calculateLabelAnchor(t, applyBottomAnchor) {
        const m = this._bezier().slopeAt(t);
        if (isNaN(m)) {
            return { x: 0, y: 0 };
        }
        const labelWidth = this._labelElement().clientWidth;
        const labelHeight = this._labelElement().clientHeight;
        let x = labelWidth - Util.within(labelWidth * (0.5 + m), 0, labelWidth);
        let y = labelHeight - Util.within(Math.abs(m), 0, labelHeight);
        if (Math.abs(m) > 20) {
            y = labelHeight / 2;
        }
        if (!this._isLoop() && applyBottomAnchor === (m >= -1)) {
            x = labelWidth - x;
            y = labelHeight - y;
        }
        return { x, y };
    }

    _calculatePointsForRegularEdge(forward, distance) {
        const axis = this._axisOfSymmetry();
        const downOrTrueLeft = Util.pointingDownOrTrueLeft(this.tail, this.head);
        if ((forward && downOrTrueLeft) || !(forward || downOrTrueLeft)) {
            distance *= -1;
        }
        const p1 = Util.pointAlongSlope(axis.point, axis.slope, distance);
        const p0 = this.tail.intersectTowards(p1);
        const p2 = this.head.intersectTowards(p1, 7);
        return { p0, p1, p2 };
    }

    _controlElement() {
        return this._gElement().children[2];
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

    _setDAndPositionElements(p0, p1, p2) {
        const bezier = new Qbezier(p0, p1, p2);
        const dString = bezier.svgPathString();
        this.element.setAttributeNS(null, 'd', dString);
        this._animateMotionElement().setAttributeNS(null, 'path', dString);
        const vertex = this._vertexPosition();
        this._positionControlElementAt(vertex);
        const t = Number(this.element.getAttributeNS(null, 'data-labelt'));
        this._setLabelAt(t);
    }

    _setLabelAt(t, applyBottomAnchor) {
        const position = this._bezier().pointAt(t);
        const anchor = this._calculateLabelAnchor(t, applyBottomAnchor);
        const fo = this._foreignObjectElement();
        fo.setAttributeNS(null, 'x', position.x - anchor.x);
        fo.setAttributeNS(null, 'y', position.y - anchor.y);
        this.element.setAttributeNS(null, 'data-labelt', t);
    }

    _storedInputsArray() {
        const dataInputs = this.element.getAttributeNS(null, 'data-input');
        return Util.csvStringToArray(dataInputs);
    }

    _vertexPosition() {
        const bezier = this._bezier();
        if (this._isInitialEdge()) {
            return bezier.p0;
        }
        const basePoint = Util.midpoint(bezier.p0, bezier.p2);
        return Util.midpoint(basePoint, bezier.p1);
    }
}
