/* global State inputEdgeLabel dblclickState focusoutEdgeLabel inputStateLabel */
// eslint-disable-next-line no-unused-vars
class GraphMaker {
    // ************************************************************************
    // Get base element
    // ************************************************************************

    static baseEdgeElementFor(element) {
        const className = element.getAttribute('class');
        if (className === 'edge-g') {
            return element.children[0];
        } else if (className === 'edge-control') {
            return element.parentNode.children[0];
        } else if (element.classList.contains('edge-animate')) {
            return element.parentNode.parentNode.children[0];
        } else if (className === 'edge-label') {
            return element.parentNode.parentNode.children[0];
        } else if (className === 'edge-label-controller') {
            return element.parentNode.children[0];
        } else if (className === 'edge') {
            return element;
        } else {
            return undefined;
        }
    }

    static baseStateElementFor(element) {
        const classList = element.classList;
        if (classList.contains('state-g')) {
            return element.children[0];
        } else if (classList.contains('state-animate')) {
            return element.parentNode;
        } else if (classList.contains('state-inner-animate')) {
            return element.parentNode.parentNode.children[0];
        } else if (classList.contains('state-label')) {
            return element.parentNode.parentNode.children[0];
        } else if (classList.contains('state-foreign-object')) {
            return element.parentNode.children[0];
        } else {
            return element;
        }
    }

    // ************************************************************************
    // Create new element
    // ************************************************************************

    static newEdgeElementAt(place) {
        const edgeTemplate = document.getElementById('edge-g-template');
        const gElement = edgeTemplate.cloneNode(true);
        const edgeElement = gElement.children[0];
        const foreignObjectElement = gElement.children[1];
        const animateMotionElement = gElement.children[3].children[0];
        gElement.setAttributeNS(null, 'id', '');
        let i = 0;
        while (document.getElementById(`e${i}`)) {
            i += 1;
        }
        edgeElement.setAttributeNS(null, 'id', `e${i}`);
        let dString = '';
        if (place instanceof State) {
            edgeElement.setAttributeNS(null, 'data-tail', place.id());
            edgeElement.setAttributeNS(null, 'data-head', place.id());
            const { p0, p1, p2 } = place.calculateLoopEdgePoints();
            dString = `M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`;
        } else {
            const { x, y } = place;
            dString = `M ${x},${y} Q ${x},${y} ${x},${y}`;
        }
        edgeElement.setAttributeNS(null, 'd', dString);
        animateMotionElement.setAttributeNS(null, 'path', dString);
        foreignObjectElement.setAttributeNS(null, 'x', place.x);
        foreignObjectElement.setAttributeNS(null, 'y', place.y);
        this.setEdgeEventListeners(edgeElement);
        return gElement;
    }

    static newStateElementAt(position) {
        const stateTemplate = document.getElementById('state-g-template');
        const gElement = stateTemplate.cloneNode(true);
        const circleElement = gElement.children[0];
        gElement.setAttributeNS(null, 'id', '');
        const translate = `translate(${position.x}, ${position.y})`;
        gElement.setAttributeNS(null, 'transform', translate);
        let i = 0;
        while (document.getElementById(`s${i}`)) {
            i += 1;
        }
        circleElement.setAttributeNS(null, 'id', `s${i}`);
        this.setStateEventListeners(circleElement);
        return gElement;
    }

    // ************************************************************************
    // Set Event Listeners
    // ************************************************************************

    static setEdgeEventListeners(edgeElement) {
        const labelElement = edgeElement.parentNode.children[1].children[0];
        labelElement.oninput = inputEdgeLabel;
        labelElement.onfocusout = focusoutEdgeLabel;
        // Set this way because of WebKit
        const animateElement = edgeElement.parentNode.children[3].children[0];
        animateElement.setAttributeNS(null, 'onbegin', 'beginEdgeAnimate(event)');
        animateElement.setAttributeNS(null, 'onend', 'endEdgeAnimate(event)');
    }

    static setStateEventListeners(stateElement) {
        stateElement.ondblclick = dblclickState;
        const gElement = stateElement.parentNode;
        const labelElement = gElement.children[2].children[0];
        labelElement.oninput = inputStateLabel;
        const innerAnimateElement = gElement.children[1].children[0];
        innerAnimateElement.setAttributeNS(null, 'onbegin', 'beginStateAnimate(event)');
        innerAnimateElement.setAttributeNS(null, 'onend', 'endStateAnimate(event)');
        const outerAnimateElement = gElement.children[0].children[0];
        outerAnimateElement.setAttributeNS(null, 'onbegin', 'beginStateAnimate(event)');
        outerAnimateElement.setAttributeNS(null, 'onend', 'endStateAnimate(event)');
    }
}
