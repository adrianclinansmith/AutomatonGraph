/* global */

// eslint-disable-next-line no-unused-vars
class Graph {
    constructor(svg) {
        this.svg = svg;
        this.xmlns = 'http://www.w3.org/2000/svg';
        this.selectedObject = null;
        this.selectedPositionOffset = { x: 0, y: 0 };
    }

    moveSelected(toPosition) {
        const svgElement = this.selectedObject;
        if (svgElement.nodeName === 'circle') {
            const x = toPosition.x + this.selectedPositionOffset.x;
            const y = toPosition.y + this.selectedPositionOffset.y;
            svgElement.setAttributeNS(null, 'cx', x);
            svgElement.setAttributeNS(null, 'cy', y);
        }
    }

    newStateAt(position) {
        const circle = document.createElementNS(this.xmlns, 'circle');
        circle.setAttributeNS(null, 'cx', position.x);
        circle.setAttributeNS(null, 'cy', position.y);
        circle.setAttributeNS(null, 'r', 30);
        circle.setAttributeNS(null, 'class', 'state');
        this.svg.appendChild(circle);
    }

    select(svgElement, position) {
        if (this.selectedObject) {
            this.selectedObject.style.stroke = 'black';
        }
        const elementType = svgElement.getAttribute('class');
        if (elementType === 'state') {
            svgElement.style.stroke = 'red';
            this.selectedObject = svgElement;
            const x = svgElement.getAttributeNS(null, 'cx') - position.x;
            const y = svgElement.getAttributeNS(null, 'cy') - position.y;
            this.selectedPositionOffset = { x, y };
        }
    }
}
