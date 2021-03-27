/*
    Init.js
    Setup the canvas for drawing digraphs.
*/

const svg = document.getElementById('svg');
let selected = false;

svg.addEventListener('mousedown', (event) => {
    const element = event.target;
    console.log(element);
    if (element.nodeName !== 'svg') {
        selected = element;
        // console.log(selected);
        // console.log(selected.nodeName);
        // console.log(selected.parentNode);
        // console.log(selected.parentNode);
    }
});

svg.addEventListener('mousemove', (event) => {
    console.log(event.target);
    console.log(typeof event.target);
    if (!selected) {
        return;
    }
    event.preventDefault();
    const coord = getMousePosition(event);
    console.log(coord);
    if (selected.nodeName === 'circle') {
        // console.log('circle nx: ');
        // console.log(selected.getAttributeNS(null, 'cx'));
        selected.setAttributeNS(null, 'cx', coord.x);
        selected.setAttributeNS(null, 'cy', coord.y);
    } else if (selected.nodeName === 'INPUT') {
        const foreignObject = selected.parentNode;
        // console.log('foreign x:');
        // console.log(foreignObject.getAttributeNS(null, 'x'));
        // console.log('event.clientX:');
        // console.log(event.clientX);
        // console.log('CMT.e:');
        // console.log(svg.getScreenCTM().e);
        foreignObject.setAttributeNS(null, 'x', coord.x);
        foreignObject.setAttributeNS(null, 'y', coord.y);
    }
});

svg.addEventListener('mouseup', (event) => {
    selected = false;
});

function getMousePosition(event) {
    const CTM = svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}
