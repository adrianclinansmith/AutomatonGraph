/* eslint-disable no-unused-vars */

/*
Utility functions which are useful across many classes but don't quite fit into
any other particular class.

A point is an object which has a numeric x and y component,
for example, p = { x: 1.2, y: -3 }.

A line is an object which has a point and a numeric slope,
for example, l = { point: p, slope: 7 }.
*/

class Util {
    /*
    Appends a string to the end a particualr line in a given string of text.
    The original string is not changed.
    */
    static appendToLine(originalString, toAppend, lineNumber) {
        const lines = originalString.split('\n');
        lines[lineNumber] = lines[lineNumber] + toAppend;
        return lines.join('\n');
    }

    /*
    Returns the distance between two points.
    */
    static distanceBetween(fromPoint, toPoint) {
        return Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
    }

    /*
    Returns a point on the line defined by fromPoint and toPoint, starting at
    fromPoint and travelling the given distance towards toPoint.
    */
    static goFromPointToPoint(fromPoint, toPoint, distance) {
        if (this.pointingLeftOrTrueUp(fromPoint, toPoint)) {
            distance *= -1;
        }
        const m = this.slopeBetween(fromPoint, toPoint);
        return this.pointAlongSlope(fromPoint, m, distance);
    }

    /*
    Returns the midpoint between two points.
    */
    static midpoint(fromPoint, toPoint) {
        const x = (fromPoint.x + toPoint.x) / 2;
        const y = (fromPoint.y + toPoint.y) / 2;
        return { x, y };
    }

    /*
    Returns a point which is arrived at by starting at fromPoint and travelling
    the given distance along the given slope.
    */
    static pointAlongSlope(fromPoint, slope, distance) {
        if (!Number.isFinite(slope)) {
            return { x: fromPoint.x, y: fromPoint.y + distance };
        }
        const d = distance / Math.sqrt(1 + slope * slope);
        const x = fromPoint.x + d;
        const y = fromPoint.y + slope * d;
        return { x, y };
    }

    /*
    Given point = { x: 2, y: -3 }, the string returned is "(2, -3)"
    */
    static pointAsString(point) {
        return `(${point.x}, ${point.y})`;
    }

    /*
    Given an arrow defined by tailPoint and tipPoint, where tipPoint is the
    arrowhead, this function returns true if the arrow is pointing downwards
    or straight left, false otherwise.
    */
    static pointingDownOrTrueLeft(tailPoint, tipPoint) {
        if (tipPoint.y === tailPoint.y) {
            return tipPoint.x < tailPoint.x;
        }
        return tipPoint.y > tailPoint.y;
    }

    /*
    Given an arrow defined by tailPoint and tipPoint, where tipPoint is the
    arrowhead, this function returns true if the arrow is pointing leftwards
    or straight up, false otherwise.
    */
    static pointingLeftOrTrueUp(tailPoint, tipPoint) {
        if (tipPoint.x === tailPoint.x) {
            return tipPoint.y < tailPoint.y;
        }
        return tipPoint.x < tailPoint.x;
    }

    /*
    Returns a point on line closest to givenPoint.
    line must consist of a point and a slope.
    */
    static pointOnLineClosestTo(givenPoint, line) {
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

    static removeWhitespace(string) {
        return string.replace(/\s+/g, '');
    }

    /*
    Returns the slope between two points.
    */
    static slopeBetween(fromPoint, toPoint) {
        return (toPoint.y - fromPoint.y) / (toPoint.x - fromPoint.x);
    }

    static stringIsEmptyOrSpace(string) {
        return string.trim() === '';
    }

    /*
    A qbezier is a quadratic bezier curve which takes a t value and outputs an
    (x, y) point, given three control points p0, p1, and p2.
    */

    /*
    Returns the coefficients a,b,c for the bezier curve B(t) = at^2 + bt + c,
    given the three control points.
    */
    static qbezierCoefficients(p0, p1, p2) {
        const x = {};
        x.a = p0.x - 2 * p1.x + p2.x;
        x.b = 2 * (p1.x - p0.x);
        x.c = p0.x;
        const y = {};
        y.a = p0.y - 2 * p1.y + p2.y;
        y.b = 2 * (p1.y - p0.y);
        y.c = p0.y;
        return { x, y };
    }

    /*
    Retruns the (x,y) point on a bezier curve given the three control points
    and t value.
    */
    static qbezierPoint(p0, p1, p2, t) {
        const co = this.qbezierCoefficients(p0, p1, p2);
        const x = co.x.a * t ** 2 + co.x.b * t + co.x.c;
        const y = co.y.a * t ** 2 + co.y.b * t + co.y.c;
        return { x, y };
    }

    /*
    CSV String is a string of comma-separated values, i.e. "dog, cat, bird".
    An empty string represents no value.
    A string without any commas is a single value.
    */

    static arrayToCsvString(array) {
        return array.join();
    }

    static csvStringToArray(csvString) {
        if (csvString === '') {
            return [];
        }
        return csvString.split(',');
    }

    static csvStringHasBlank(csvString) {
        return csvString === '' || csvString.startsWith(',') ||
            csvString.endsWith(',') || csvString.includes(',,');
    }

    static csvStringFirst(csvString) {
        const array = this.csvStringToArray(csvString);
        return array.shift();
    }

    static removeFirstFromCsvString(cvsString) {
        const i = cvsString.indexOf(',');
        if (i === -1) {
            return '';
        }
        return cvsString.slice(i + 1);
    }
}
