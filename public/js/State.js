/* global Edge GraphMaker Util */
// eslint-disable-next-line no-unused-vars
class State {
    // ************************************************************************
    // Constructor
    // ************************************************************************

    constructor(element) {
        this.element = GraphMaker.baseStateElementFor(element);
        const centerPosition = this._centerPosition();
        this.x = centerPosition.x;
        this.y = centerPosition.y;
        this.positionOffset = { x: 0, y: 0 };
        this.edgeP1Statuses = [];
    }

    // ************************************************************************
    // Public Methods
    // ************************************************************************

    addInEdge(edge) {
        let inEdgesString = this.element.getAttributeNS(null, 'data-inedges');
        inEdgesString += `${edge.id()} `;
        this.element.setAttributeNS(null, 'data-inedges', inEdgesString);
    }

    addInput(input) {
        const storedInputsArray = this._storedInputsArray();
        if (!storedInputsArray.includes(input)) {
            storedInputsArray.push(input);
            const csvString = Util.arrayToCsvString(storedInputsArray);
            this.element.setAttributeNS(null, 'data-input', csvString);
        }
    }

    addOutEdge(edge) {
        let outEdgesString = this.element.getAttributeNS(null, 'data-outedges');
        outEdgesString += `${edge.id()} `;
        this.element.setAttributeNS(null, 'data-outedges', outEdgesString);
    }

    animate() {
        if (this.isGoal()) {
            this._innerAnimateElement().beginElement();
        } else {
            this._animateElement().beginElement();
        }
    }

    clearStoredInputs() {
        this.element.setAttributeNS(null, 'data-input', '');
    }

    calculateLoopEdgePoints() {
        const p0 = this.pointOnPerimeter(-3 * Math.PI / 4);
        const p2 = this.pointOnPerimeter(-Math.PI / 4);
        p2.y -= 7;
        const p1 = { x: this.x, y: this.y - 120 };
        return { p0, p1, p2 };
    }

    equals(otherState) {
        return otherState instanceof State && otherState.id() === this.id();
    }

    focusLabel() {
        this._textInputElement().focus();
    }

    hasNoInputs() {
        const dataInputs = this.element.getAttributeNS(null, 'data-input');
        return dataInputs === '';
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    inputString() {
        return this.element.getAttributeNS(null, 'data-input');
    }

    intersectTowards(point, spacing) {
        const radius = this.radius() + (spacing || 0);
        return Util.goFromPointToPoint(this, point, radius);
    }

    isGoal() {
        return this._innerCircleElement().style.visibility !== '';
    }

    labelValue() {
        return this.element.getAttributeNS(null, 'data-labelvalue');
    }

    moveTo(position) {
        this.x = position.x + this.positionOffset.x;
        this.y = position.y + this.positionOffset.y;
        const translate = `translate(${this.x}, ${this.y})`;
        this._gElement().setAttributeNS(null, 'transform', translate);
        let i = 0;
        for (const edge of this._allEdges()) {
            const status = this.edgeP1Statuses[i++];
            edge.resetForMovedState(status.p1IsForward, status.p1Height);
        }
    }

    outEdges() {
        return this._edges('data-outedges');
    }

    pointBetween(otherState) {
        return Util.midpoint(this, otherState);
    }

    pointOnPerimeter(radAngle) {
        const r = this.radius();
        const x = r * Math.cos(radAngle) + this.x;
        const y = r * Math.sin(radAngle) + this.y;
        return { x, y };
    }

    popInput() {
        const dataInputs = this.element.getAttributeNS(null, 'data-input');
        const firstInput = Util.csvStringFirst(dataInputs);
        const newDataInputs = Util.removeFirstFromCsvString(dataInputs);
        this.element.setAttributeNS(null, 'data-input', newDataInputs);
        return firstInput;
    }

    radius() {
        let rString = this.element.getAttributeNS(null, 'r');
        rString = rString.replace('px', '');
        return Number(rString);
    }

    remove() {
        for (const edge of this._edges('data-inedges')) {
            edge.remove();
        }
        for (const edge of this._edges('data-outedges')) {
            edge.remove();
        }
        this._gElement().remove();
    }

    removeInEdge(edge) {
        const string = this.element.getAttributeNS(null, 'data-inedges');
        const newString = string.replace(`${edge.id()} `, '');
        this.element.setAttributeNS(null, 'data-inedges', newString);
    }

    removeOutEdge(edge) {
        const string = this.element.getAttributeNS(null, 'data-outedges');
        const newString = string.replace(`${edge.id()} `, '');
        this.element.setAttributeNS(null, 'data-outedges', newString);
    }

    run() {
        for (const outEdge of this._edges('data-outedges')) {
            outEdge.animate();
        }
    }

    select(withPositionOffset) {
        this.setColor('red');
        this.setPositionOffset(withPositionOffset);
        this._calculateEdgeP1Statuses();
    }

    setColor(color) {
        this.element.style.stroke = color;
        this._innerCircleElement().style.stroke = color;
    }

    setLabelText(textString, textColor = '', dontStoreValue = false) {
        const textInputElement = this._textInputElement();
        textInputElement.setAttributeNS(null, 'value', textString);
        textInputElement.value = textString;
        textInputElement.style.color = textColor;
        const event = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        event.dontStoreValue = dontStoreValue;
        textInputElement.dispatchEvent(event);
    }

    setPositionOffset(fromPoint) {
        const offset = {};
        offset.x = this.x - fromPoint.x;
        offset.y = this.y - fromPoint.y;
        this.positionOffset = offset;
    }

    toggleGoal() {
        if (this.isGoal()) {
            this._innerCircleElement().style.visibility = '';
        } else {
            this._innerCircleElement().style.visibility = 'visible';
        }
    }

    // ************************************************************************
    // Private Methods
    // ************************************************************************

    _allEdges() {
        const edges = this._edges('data-inedges');
        return edges.concat(this._edges('data-outedges'));
    }

    _animateElement() {
        return this.element.children[0];
    }

    _calculateEdgeP1Statuses() {
        this.edgeP1Statuses = [];
        for (const edge of this._allEdges()) {
            const p1Status = {};
            p1Status.p1IsForward = edge.calculateP1IsForward();
            p1Status.p1Height = edge.calculateP1Height();
            this.edgeP1Statuses.push(p1Status);
        }
    }

    _centerPosition() {
        const trans = this._gElement().getAttributeNS(null, 'transform');
        const x = trans.substring(trans.indexOf('(') + 1, trans.indexOf(','));
        const y = trans.substring(trans.indexOf(',') + 1, trans.indexOf(')'));
        return { x: parseFloat(x), y: parseFloat(y) };
    }

    _gElement() {
        return this.element.parentNode;
    }

    _edges(edgeDataString) {
        const edges = [];
        const edgeIds = this.element.getAttributeNS(null, edgeDataString);
        for (const id of edgeIds.split(' ')) {
            if (id) {
                const edgeElement = document.getElementById(id);
                edges.push(new Edge(edgeElement));
            }
        }
        return edges;
    }

    _innerAnimateElement() {
        return this._innerCircleElement().children[0];
    }

    _innerCircleElement() {
        return this._gElement().children[1];
    }

    _storedInputsArray() {
        const dataInputs = this.element.getAttributeNS(null, 'data-input');
        return Util.csvStringToArray(dataInputs);
    }

    _textInputElement() {
        return this._gElement().children[2].children[0];
    }
}
