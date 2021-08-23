/* global Edge getPointTowards midpoint */
// eslint-disable-next-line no-unused-vars
class State {
    /* Static */

    static createElementAt(position) {
        const template = document.getElementById('state-g-template');
        const gElement = template.cloneNode(true);
        const circleElement = gElement.children[0];
        gElement.setAttributeNS(null, 'id', '');
        const translate = `translate(${position.x}, ${position.y})`;
        gElement.setAttributeNS(null, 'transform', translate);
        let i = 0;
        while (document.getElementById(`s${i}`)) {
            i += 1;
        }
        circleElement.setAttributeNS(null, 'id', `s${i}`);
        State.setLabelCallback(circleElement);
        return gElement;
    }

    static setLabelCallback(stateElement) {
        const label = stateElement.parentNode.children[2].children[0];
        label.oninput = function(event) {
            const target = event.target;
            let textOverflow = true;
            let size = 25;
            while (textOverflow && size > 1) {
                target.style.fontSize = `${size}px`;
                target.setAttributeNS(null, 'value', target.value);
                textOverflow = target.scrollWidth > target.clientWidth;
                size -= 1;
            }
        };
    }

    /* Constructor */

    constructor(elementOrId) {
        if (typeof elementOrId === 'string' || elementOrId instanceof String) {
            this.element = document.getElementById(elementOrId);
        } else if (elementOrId.classList.contains('state-g')) {
            this.element = elementOrId.children[0];
        } else if (elementOrId.classList.contains('state-animate')) {
            this.element = elementOrId.parentNode;
        } else if (elementOrId.classList.contains('state-inner-animate')) {
            this.element = elementOrId.parentNode.parentNode.children[0];
        } else {
            this.element = elementOrId;
        }
        const centerPosition = this.centerPosition();
        this.x = centerPosition.x;
        this.y = centerPosition.y;
        this.positionOffset = { x: 0, y: 0 };
    }

    /* Instance */

    addInEdge(edge) {
        let inEdgesString = this.element.getAttributeNS(null, 'data-inedges');
        inEdgesString += `${edge.id()} `;
        this.element.setAttributeNS(null, 'data-inedges', inEdgesString);
    }

    addOutEdge(edge) {
        let outEdgesString = this.element.getAttributeNS(null, 'data-outedges');
        outEdgesString += `${edge.id()} `;
        this.element.setAttributeNS(null, 'data-outedges', outEdgesString);
    }

    animate(input) {
        this._setDataInput(input);
        if (this.isGoal()) {
            this._innerAnimateElement().beginElement();
        } else {
            this._animateElement().beginElement();
        }
    }

    centerPosition() {
        const trans = this._gElement().getAttributeNS(null, 'transform');
        const x = trans.substring(trans.indexOf('(') + 1, trans.indexOf(','));
        const y = trans.substring(trans.indexOf(',') + 1, trans.indexOf(')'));
        return { x: parseFloat(x), y: parseFloat(y) };
    }

    equals(otherState) {
        return otherState instanceof State && otherState.id() === this.id();
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

    isGoal() {
        return this._innerCircleElement().style.visibility !== '';
    }

    isGoalWithNoInput() {
        return this.isGoal() && this.input().length === 0;
    }

    intersectTowards(point, spacing) {
        let radius = this.radius();
        radius += spacing || 0;
        return getPointTowards(this.centerPosition(), point, radius);
    }

    moveTo(position) {
        this.x = position.x + this.positionOffset.x;
        this.y = position.y + this.positionOffset.y;
        const translate = `translate(${this.x}, ${this.y})`;
        this._gElement().setAttributeNS(null, 'transform', translate);
        this._allEdges().forEach(edge => { edge.resetForMovedState(); });
    }

    outEdges() {
        return this._edges('data-outedges');
    }

    pointBetween(otherState) {
        const thisPosition = this.centerPosition();
        const otherPosition = otherState.centerPosition();
        return midpoint(thisPosition, otherPosition);
    }

    pointOnPerimeter(radAngle) {
        const center = this.centerPosition();
        const r = this.radius();
        const x = r * Math.cos(radAngle) + center.x;
        const y = r * Math.sin(radAngle) + center.y;
        return { x, y };
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

    sendInputToOutEdges() {
        let numberOfAnimatedEdges = 0;
        for (const outEdge of this.outEdges()) {
            const wasAnimated = outEdge.animateOnValidInput(this.input());
            if (wasAnimated) {
                numberOfAnimatedEdges++;
            }
        }
        return numberOfAnimatedEdges;
    }

    setColor(color) {
        this.element.style.stroke = color;
        this._innerCircleElement().style.stroke = color;
    }

    setPositionOffset(fromPoint) {
        const centerPosition = this.centerPosition();
        const positionOffset = {};
        positionOffset.x = centerPosition.x - fromPoint.x;
        positionOffset.y = centerPosition.y - fromPoint.y;
        this.positionOffset = positionOffset;
    }

    setLabel(textString) {
        this._textInputElement().setAttributeNS(null, 'value', textString);
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

    _gElement() {
        return this.element.parentNode;
    }

    _edges(edgeDataString) {
        const edges = [];
        const edgeIds = this.element.getAttributeNS(null, edgeDataString);
        for (const id of edgeIds.split(' ')) {
            if (id) {
                edges.push(new Edge(id));
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

    // _midpointTo(otherState) {
    //     const thisPosition = this.centerPosition();
    //     const otherPosition = otherState.centerPosition();
    //     const x = (thisPosition.x + otherPosition.x) / 2;
    //     const y = (thisPosition.y + otherPosition.y) / 2;
    //     return { x, y };
    // }

    _setDataInput(input) {
        this.element.setAttributeNS(null, 'data-input', input);
    }

    // _slopeTo(otherState) {
    //     const thisPosition = this.centerPosition();
    //     const otherPosition = otherState.centerPosition();
    //     const rise = otherPosition.y - thisPosition.y;
    //     const run = otherPosition.x - thisPosition.x;
    //     return rise / run;
    // }

    _textInputElement() {
        return this._gElement().children[2].children[0];
    }
}
