/* global Edge onStateLabelInput Util */
// eslint-disable-next-line no-unused-vars
class State {
    /* Static */

    static createElementAt(position) {
        const template = document.getElementById('state-g-template');
        const gElement = template.cloneNode(true);
        const circleElement = gElement.children[0];
        const labelElement = gElement.children[2].children[0];
        gElement.setAttributeNS(null, 'id', '');
        const translate = `translate(${position.x}, ${position.y})`;
        gElement.setAttributeNS(null, 'transform', translate);
        let i = 0;
        while (document.getElementById(`s${i}`)) {
            i += 1;
        }
        circleElement.setAttributeNS(null, 'id', `s${i}`);
        labelElement.oninput = onStateLabelInput;
        return gElement;
    }

    /* Constructor */

    constructor(elementOrId) {
        if (elementOrId.classList.contains('state-g')) {
            this.element = elementOrId.children[0];
        } else if (elementOrId.classList.contains('state-animate')) {
            this.element = elementOrId.parentNode;
        } else if (elementOrId.classList.contains('state-inner-animate')) {
            this.element = elementOrId.parentNode.parentNode.children[0];
        } else {
            this.element = elementOrId;
        }
        const centerPosition = this._centerPosition();
        this.x = centerPosition.x;
        this.y = centerPosition.y;
        this.positionOffset = { x: 0, y: 0 };
        this.controlStatuses = [];
    }

    /* Instance */

    addInEdge(edge) {
        let inEdgesString = this.element.getAttributeNS(null, 'data-inedges');
        inEdgesString += `${edge.id()} `;
        this.element.setAttributeNS(null, 'data-inedges', inEdgesString);
    }

    addInput(input) {
        const storedInputsArray = this._storedInputsArray();
        storedInputsArray.push(input);
        const storedInputsString = Util.arrayToCsvString(storedInputsArray);
        this.element.setAttributeNS(null, 'data-input', storedInputsString);
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

    intersectTowards(point, spacing) {
        let radius = this.radius();
        radius += spacing || 0;
        return Util.goFromPointToPoint(this, point, radius);
    }

    isGoal() {
        return this._innerCircleElement().style.visibility !== '';
    }

    moveTo(position) {
        this.x = position.x + this.positionOffset.x;
        this.y = position.y + this.positionOffset.y;
        const translate = `translate(${this.x}, ${this.y})`;
        this._gElement().setAttributeNS(null, 'transform', translate);
        let i = 0;
        for (const edge of this._allEdges()) {
            const { isForward, distance } = this.controlStatuses[i++];
            edge.resetForMovedState(isForward, distance);
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

    run() {
        for (const outEdge of this._edges('data-outedges')) {
            outEdge.animate();
        }
    }

    select(withPositionOffset) {
        this.setColor('red');
        this.setPositionOffset(withPositionOffset);
        this._calculatecontrolStatuses();
    }

    setColor(color) {
        this.element.style.stroke = color;
        this._innerCircleElement().style.stroke = color;
    }

    setLabel(textString) {
        const textInputElement = this._textInputElement();
        textInputElement.setAttributeNS(null, 'value', textString);
        const event = new Event('input', {
            bubbles: true,
            cancelable: true
        });
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

    /* Private Instance */

    _allEdges() {
        const edges = this._edges('data-inedges');
        return edges.concat(this._edges('data-outedges'));
    }

    _animateElement() {
        return this.element.children[0];
    }

    _calculatecontrolStatuses() {
        this.controlStatuses = [];
        for (const edge of this._allEdges()) {
            const controlStatus = {};
            controlStatus.isForward = edge.calculateControlIsForward();
            controlStatus.distance = edge.calculateControlDistance();
            this.controlStatuses.push(controlStatus);
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
