// eslint-disable-next-line no-unused-vars
class State {
    /* Static */

    static newElementIn(svgElement, atPosition) {
        const xmlns = 'http://www.w3.org/2000/svg';
        const xhtml = 'http://www.w3.org/1999/xhtml';
        const g = document.createElementNS(xmlns, 'g');
        g.setAttributeNS(null, 'class', 'state-g');
        const circle = document.createElementNS(xmlns, 'circle');
        circle.setAttributeNS(null, 'class', 'state');
        circle.setAttributeNS(null, 'r', '30px');
        circle.setAttributeNS(null, 'id', this.nextAvailableId());
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
        svgElement.appendChild(g);
        const translate = `translate(${atPosition.x}, ${atPosition.y})`;
        g.setAttributeNS(null, 'transform', translate);
        this.setLabelCallback(circle);
    }

    static nextAvailableId() {
        let i = 0;
        while (document.getElementById(`s${i}`)) {
            i += 1;
        }
        return `s${i}`;
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

    constructor(element, positionOffset) {
        this.element = element;
        this.positionOffset = positionOffset;
    }

    /* Instance */

    focusLabel() {
        this.element.parentNode.children[1].children[0].focus();
    }

    moveTo(position) {
        const x = position.x + this.positionOffset.x;
        const y = position.y + this.positionOffset.y;
        const translate = `translate(${x}, ${y})`;
        this.element.parentNode.setAttributeNS(null, 'transform', translate);
    }

    setStrokeColor(color) {
        this.element.style.stroke = color;
    }
}
