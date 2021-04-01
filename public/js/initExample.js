/*
    Init.js
    Setup the canvas for drawing digraphs.
*/

// buttons and inputs

const newStateButton = document.getElementById('newStateButton');
const downloadButton = document.getElementById('downloadButton');
const uploadInput = document.getElementById('uploadInput');

// globals

let svg = document.getElementById('svg');
let selected = false;

// setup

function initSvg() {
    console.log('init new svg');
    svg.addEventListener('mousedown', mousedown);
    svg.addEventListener('mousemove', mousemove);
    svg.addEventListener('mouseup', mouseup);
    svg.addEventListener('dblclick', dblclick);
}

// *************************************************
// mouse events
// *************************************************

function mousedown(evt) {
    console.log('mouse down');
    const element = evt.target;
    if (element.nodeName !== 'svg') {
        selected = element;
    }
}

function mousemove(evt) {
    if (!selected) {
        return;
    }
    evt.preventDefault();
    const coord = getMousePosition(evt);
    if (selected.getAttributeNS(null, 'class').startsWith('state')) {
        selected.parentNode.setAttributeNS(null, 'transform', `translate(${coord.x}, ${coord.y})`);
    }
}

function mouseup(evt) {
    selected = false;
}

function dblclick(evt) {
    if (evt.target.getAttributeNS(null, 'class') === 'state') {
        evt.target.parentNode.children[1].children[0].focus();
    }
}

function getMousePosition(event) {
    const CTM = svg.getScreenCTM();
    return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
    };
}

// *************************************************
// button events
// *************************************************

newStateButton.addEventListener('click', () => {
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

downloadButton.addEventListener('click', () => {
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'mygraph.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

uploadInput.addEventListener('change', (event) => {
    const svgBlob = uploadInput.files[0];
    svgBlob.text().then(
        (svgText) => {
            document.getElementById('svgDiv').innerHTML = svgText;
            svg = document.getElementById('svg');
            initSvg();
        },
        (error) => {
            console.log(error);
        });
});
