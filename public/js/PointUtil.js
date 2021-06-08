/* eslint-disable no-unused-vars */
function isPointingleftOrStraightUp(tailPosition, headPosition) {
    if (headPosition.x === tailPosition.x) {
        return headPosition.y < tailPosition.y;
    }
    return headPosition.x < tailPosition.x;
}

function pointAlongSlope(fromPoint, toPoint, distance) {
    if (isPointingleftOrStraightUp(fromPoint, toPoint)) {
        distance *= -1;
    }
    const m = slope(fromPoint, toPoint);
    if (!Number.isFinite(m)) {
        return { x: fromPoint.x, y: fromPoint.y + distance };
    }
    const d = distance * Math.sqrt(1 / (1 + m * m));
    const x = fromPoint.x + d;
    const y = fromPoint.y + m * d;
    return { x, y };
}

function slope(startpoint, endpoint) {
    return (endpoint.y - startpoint.y) / (endpoint.x - startpoint.x);
}
