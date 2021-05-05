/* global Edge */
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
        const label = stateElement.parentNode.children[1].children[0];
        console.log(label);
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
        } else {
            this.element = elementOrId;
        }
        this.positionOffset = { x: 0, y: 0 };
    }

    /* Instance */

    addInEdge(edge) {
        let inEdges = this.element.getAttributeNS(null, 'data-inedges');
        if (inEdges === '') {
            this.element.setAttributeNS(null, 'data-inedges', edge.id());
        } else {
            inEdges += ` ${edge.id()}`;
            this.element.setAttributeNS(null, 'data-inedges', inEdges);
        }
    }

    addOutEdge(edge) {
        let outEdges = this.element.getAttributeNS(null, 'data-outedges');
        if (outEdges === '') {
            this.element.setAttributeNS(null, 'data-outedges', edge.id());
        } else {
            outEdges += ` ${edge.id()}`;
            this.element.setAttributeNS(null, 'data-outedges', outEdges);
        }
    }

    centerPosition() {
        const trans = this._g().getAttributeNS(null, 'transform');
        const x = trans.substring(trans.indexOf('(') + 1, trans.indexOf(','));
        const y = trans.substring(trans.indexOf(',') + 1, trans.indexOf(')'));
        return { x: parseFloat(x), y: parseFloat(y) };
    }

    focusLabel() {
        this._g().children[1].children[0].focus();
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    moveTo(position) {
        const x = position.x + this.positionOffset.x;
        const y = position.y + this.positionOffset.y;
        const translate = `translate(${x}, ${y})`;
        this._g().setAttributeNS(null, 'transform', translate);
        this._allEdges().forEach(edge => { edge.reset(); });
    }

    setColor(color) {
        this.element.style.stroke = color;
    }

    setPositionOffset(fromPoint) {
        const centerPosition = this.centerPosition();
        const positionOffset = {};
        positionOffset.x = centerPosition.x - fromPoint.x;
        positionOffset.y = centerPosition.y - fromPoint.y;
        this.positionOffset = positionOffset;
    }

    /* Private Instance */

    _allEdges() {
        const edges = [];
        const outIds = this.element.getAttributeNS(null, 'data-outedges');
        const inIds = this.element.getAttributeNS(null, 'data-inedges');
        for (const id of outIds.split(' ')) {
            if (id) {
                edges.push(new Edge(id));
            }
        }
        for (const id of inIds.split(' ')) {
            if (id) {
                edges.push(new Edge(id));
            }
        }
        return edges;
    }

    _g() {
        return this.element.parentNode;
    }
}
