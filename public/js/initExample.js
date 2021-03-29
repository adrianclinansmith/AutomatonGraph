/*
    Init.js
    Setup the canvas for drawing digraphs.
*/

const svg = document.getElementById('svg');
let selected = false;

// mouse events

svg.addEventListener('mousedown', (event) => {
    const element = event.target;
    if (element.nodeName !== 'svg') {
        selected = element;
    }
});

svg.addEventListener('mousemove', (event) => {
    // console.log(event.target);
    // console.log(event.target.parentNode);
    if (!selected) {
        return;
    }
    event.preventDefault();
    const coord = getMousePosition(event);
    if (selected.getAttributeNS(null, 'class').startsWith('state')) {
        selected.parentNode.setAttributeNS(null, 'transform', `translate(${coord.x}, ${coord.y})`);
    }
});

svg.addEventListener('mouseup', (event) => {
    selected = false;
});

svg.addEventListener('dblclick', (event) => {
    console.log(event.target);
    // event.preventDefault();
    // event.stopPropagation();
    if (event.target.getAttributeNS(null, 'class') === 'state') {
        event.target.parentNode.children[1].children[0].focus();
    }
});

function getMousePosition(event) {
    const CTM = svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}

// button events

document.getElementById('newStateButton').addEventListener('click', () => {
    const xmlns = 'http://www.w3.org/2000/svg';
    const xhtml = 'http://www.w3.org/1999/xhtml';

    const g = document.createElementNS(xmlns, 'g');
    g.setAttributeNS(null, 'class', 'state-g');

    const circle = document.createElementNS(xmlns, 'circle');
    circle.setAttributeNS(null, 'class', 'state');
    circle.setAttributeNS(null, 'r', '30px');

    const fo = document.createElementNS(xmlns, 'foreignObject');
    fo.setAttributeNS(null, 'class', 'state-fo');
    fo.setAttributeNS(null, 'height', '100%');
    fo.setAttributeNS(null, 'requiredExtensions', xhtml);
    fo.setAttributeNS(null, 'width', '100%');
    fo.setAttributeNS(null, 'x', '-21');
    fo.setAttributeNS(null, 'y', '-23');
    fo.innerHTML = `<input xmlns="${xhtml}" class="state-label" type="text" value="s0"></input>`;

    g.appendChild(circle);
    g.appendChild(fo);
    svg.appendChild(g);

    g.setAttributeNS(null, 'transform', `translate(${100}, ${100})`);
});

//  <g class="state-g" transform="translate(50 50)">
//     <circle r="30px" class="state"></circle>
//     <foreignObject width="100%" height="100%" x="-21" y="-23" class="state-fo">
//         <input xmlns="http://www.w3.org/1999/xhtml" value="s0" class="state-label"></input>
//     </foreignObject>
// </g>
