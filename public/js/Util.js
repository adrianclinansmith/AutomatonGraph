/* eslint-disable no-unused-vars */

function appendToLine(originalString, toAppend, lineNumber) {
    const lines = originalString.split('\n');
    lines[lineNumber] = lines[lineNumber] + toAppend;
    return lines.join('\n');
}

function distanceBetween(fromPoint, toPoint) {
    return Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
}

function pointAsString(point) {
    return `(${point.x}, ${point.y})`;
}

/*
Returns a point on line closest to givenPoint.
givenPoint must consist of an x and y.
line must consist of a point and a slope.
*/
function pointOnLineClosestTo(givenPoint, line) {
    if (!Number.isFinite(line.slope)) {
        return { x: line.point.x, y: givenPoint.y };
    } else if (line.slope === 0) {
        return { x: givenPoint.x, y: line.point.y };
    }
    const a = line.slope;
    const b = -1 / line.slope;
    const c = -line.slope * line.point.x + line.point.y;
    const d = givenPoint.x / line.slope + givenPoint.y;
    return { x: (d - c) / (a - b), y: a * (d - c) / (a - b) + c };
}

function isPointingleftOrStraightUp(tailPoint, tipPoint) {
    if (tipPoint.x === tailPoint.x) {
        return tipPoint.y < tailPoint.y;
    }
    return tipPoint.x < tailPoint.x;
}

function midpoint(fromPoint, toPoint) {
    const x = (fromPoint.x + toPoint.x) / 2;
    const y = (fromPoint.y + toPoint.y) / 2;
    return { x, y };
}

/*
Returns a point on the line defined by fromPoint and toPoint, starting at
fromPoint and travelling the given distance towards toPoint.
*/
function getPointTowards(fromPoint, toPoint, distance) {
    if (isPointingleftOrStraightUp(fromPoint, toPoint)) {
        distance *= -1;
    }
    const m = slopeBetween(fromPoint, toPoint);
    return pointAlongSlope(fromPoint, m, distance);
    // if (!Number.isFinite(m)) {
    //     return { x: fromPoint.x, y: fromPoint.y + distance };
    // }
    // const d = distance / Math.sqrt(1 + m * m);
    // const x = fromPoint.x + d;
    // const y = fromPoint.y + m * d;
    // return { x, y };
}

function pointAlongSlope(fromPoint, slope, distance) {
    if (!Number.isFinite(slope)) {
        return { x: fromPoint.x, y: fromPoint.y + distance };
    }
    const d = distance / Math.sqrt(1 + slope * slope);
    const x = fromPoint.x + d;
    const y = fromPoint.y + slope * d;
    return { x, y };
}

/*
Returns the slope between startpiont and endpoint.
*/
function slopeBetween(startpoint, endpoint) {
    return (endpoint.y - startpoint.y) / (endpoint.x - startpoint.x);
}
