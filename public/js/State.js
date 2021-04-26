// eslint-disable-next-line no-unused-vars
class State {
    /* Static */

    static createElementAt(position) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const xhtml = 'http://www.w3.org/1999/xhtml';
        const g = document.createElementNS(xmlns, 'g');
        g.setAttributeNS(null, 'class', 'state-g');
        const circle = document.createElementNS(xmlns, 'circle');
        circle.setAttributeNS(null, 'class', 'state');
        circle.setAttributeNS(null, 'r', '30px');
        let i = 0;
        while (document.getElementById(`s${i}`)) {
            i += 1;
        }
        circle.setAttributeNS(null, 'id', `s${i}`);
        const fo = document.createElementNS(xmlns, 'foreignObject');
        fo.setAttributeNS(null, 'class', 'state-fo');
        fo.setAttributeNS(null, 'height', '100%');
        fo.setAttributeNS(null, 'requiredExtensions', xhtml);
        fo.setAttributeNS(null, 'width', '100%');
        fo.setAttributeNS(null, 'x', '-21');
        fo.setAttributeNS(null, 'y', '-23');
        let textInput = `<input xmlns="${xhtml}" `;
        textInput += 'class="state-label" type="text"></input>';
        fo.innerHTML = textInput;
        g.appendChild(circle);
        g.appendChild(fo);
        const translate = `translate(${position.x}, ${position.y})`;
        g.setAttributeNS(null, 'transform', translate);
        this.setLabelCallback(circle);
        return g;
    }

    static setLabelCallback(stateElement) {
        const label = stateElement.parentNode.children[1].children[0];
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

    constructor(element) {
        this.element = element;
        this.positionOffset = { x: 0, y: 0 };
    }

    /* Instance */

    focusLabel() {
        this.element.parentNode.children[1].children[0].focus();
    }

    centerPosition() {
        const g = this.element.parentNode;
        const trans = g.getAttributeNS(null, 'transform');
        const x = trans.substring(trans.indexOf('(') + 1, trans.indexOf(','));
        const y = trans.substring(trans.indexOf(',') + 1, trans.indexOf(')'));
        return { x: parseFloat(x), y: parseFloat(y) };
    }

    id() {
        return this.element.getAttributeNS(null, 'id');
    }

    moveTo(position) {
        const x = position.x + this.positionOffset.x;
        const y = position.y + this.positionOffset.y;
        const translate = `translate(${x}, ${y})`;
        this.element.parentNode.setAttributeNS(null, 'transform', translate);
    }

    setPositionOffset(fromPoint) {
        const centerPosition = this.centerPosition();
        const positionOffset = {};
        positionOffset.x = centerPosition.x - fromPoint.x;
        positionOffset.y = centerPosition.y - fromPoint.y;
        this.positionOffset = positionOffset;
    }

    setStrokeColor(color) {
        this.element.style.stroke = color;
    }
}
