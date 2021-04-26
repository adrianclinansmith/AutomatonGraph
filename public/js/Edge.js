// eslint-disable-next-line no-unused-vars
class Edge {
    /* Static */

    static createElementAt(startPosition) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const element = document.createElementNS(xmlns, 'path');
        const { x, y } = startPosition;
        element.setAttributeNS(null, 'stroke', 'red');
        element.setAttributeNS(null, 'd', `M ${x} ${y} L ${x} ${y}`);
        return element;
    }

    /* Constructor */

    constructor(edgeElement) {
        const d = edgeElement.getAttributeNS(null, 'd');
        const dParts = d.split(' ');
        this.element = edgeElement;
        this.tail = { x: dParts[1], y: dParts[2] };
        this.head = { x: dParts[4], y: dParts[5] };
    }

    /* Instance */

    setHead(position) {
        this.head = { x: position.x, y: position.y };
        const tailString = `M ${this.tail.x} ${this.tail.y}`;
        const headString = `L ${this.head.x} ${this.head.y}`;
        this.element.setAttributeNS(null, 'd', `${tailString} ${headString}`);
    }
}
