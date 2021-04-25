/* global State */

// eslint-disable-next-line no-unused-vars
class Graph {
    /* Constructor */
    constructor(svg) {
        this.svg = svg;
        this.xmlns = 'http://www.w3.org/2000/svg';
        this.selectedObject = null;
        this.temporaryEdge = null;
        this.angle = Math.PI / -2;
        this.selectedPositionOffset = { x: 0, y: 0 };
    }

    /* Instance */

    addNewState() {
        const x = this.width() / 2 + 30 * Math.cos(this.angle);
        const y = this.height() - 5 - 30 * (2 + Math.sin(this.angle));
        this.angle += Math.PI / 2;
        if (Math.abs(this.angle - 3 * Math.PI / 2) < 0.01) {
            this.angle = Math.PI / -4;
        } else if (Math.abs(this.angle - 7 * Math.PI / 4) < 0.01) {
            this.angle = Math.PI / -2;
        }
        State.newElementIn(this.svg, { x, y });
    }

    height() {
        return this.svg.height.baseVal.value;
    }

    moveSelectedTo(position) {
        if (this.selectedObject instanceof State) {
            this.selectedObject.moveTo(position);
        }
    }

    select(element, atPosition) {
        if (this.selectedObject instanceof State) {
            this.selectedObject.setStrokeColor('black');
        }
        if (element.getAttribute('class') === 'state') {
            const trans = element.parentNode.getAttributeNS(null, 'transform');
            const x = trans.substring(trans.indexOf('(') + 1, trans.indexOf(','));
            const y = trans.substring(trans.indexOf(',') + 1, trans.indexOf(')'));
            const positionOffset = {};
            positionOffset.x = x - atPosition.x;
            positionOffset.y = y - atPosition.y;
            this.selectedObject = new State(element, positionOffset);
            this.selectedObject.setStrokeColor('red');
        }
    }

    width() {
        return this.svg.width.baseVal.value;
    }

    xmlBlob() {
        const xmlString = (new XMLSerializer()).serializeToString(this.svg);
        const imageType = 'image/svg+xml;charset=utf-8';
        return new Blob([xmlString], { type: imageType });
    }
}
