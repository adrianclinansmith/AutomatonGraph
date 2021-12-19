/* global Util */
/*
    A quadratic bezier curve takes a t value and outputs an (x, y) point,
    given three control points p0, p1, and p2.
*/

// eslint-disable-next-line no-unused-vars
class Qbezier {
    // ************************************************************************
    /* Constructor */
    // ************************************************************************

    constructor(p0, p1, p2) {
        if (p1 && !p2) {
            p2 = p1;
            p1 = Util.midpoint(p0, p2);
        } else if (!p1 && p2) {
            p1 = Util.midpoint(p0, p2);
        }
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
    }

    // ************************************************************************
    /* Instance methods */
    // ************************************************************************

    /*
    Returns the t value of the point on the curve that's closest to the given
    point.
    */
    tClosestTo(point) {
        let t;
        let shortestDistance = Infinity;
        const step = 0.2;
        for (let i = 0; i < 1 / step; i++) {
            const n = i * step;
            const start = this.pointAt(n);
            const end = this.pointAt(n + step);
            const ti = Util.lineSegmentFraction(point, start, end) * step + n;
            const curvePointi = this.pointAt(ti);
            const distancei = Util.distanceBetween(point, curvePointi);
            if (distancei < shortestDistance) {
                shortestDistance = distancei;
                t = ti;
            }
        }
        return t;
    }

    /*
    Returns the coefficients a,b,c for the curve as B(t) = at^2 + bt + c.
    */
    coefficients() {
        const { p0, p1, p2 } = this.controlPoints();
        const ax = p0.x - 2 * p1.x + p2.x;
        const bx = 2 * (p1.x - p0.x);
        const cx = p0.x;
        const ay = p0.y - 2 * p1.y + p2.y;
        const by = 2 * (p1.y - p0.y);
        const cy = p0.y;
        return { ax, bx, cx, ay, by, cy };
    }

    /*
    Returns the control points that define the curve
    */
    controlPoints() {
        return { p0: this.p0, p1: this.p1, p2: this.p2 };
    }

    heightToBaseRatio() {
        const { p0, p1, p2 } = this.controlPoints();
        const basePoint = Util.midpoint(p0, p2);
        const height = Util.distanceBetween(basePoint, p1);
        const base = Util.distanceBetween(p0, p2);
        return height / base;
    }

    /*
    Returns the t value where the curve is horizontal, meaning the derivative
    with respect to y is zero.
    */
    horizontalT() {
        const co = this.coefficients();
        return -co.by / (2 * co.ay);
    }

    /*
    Retruns the (x,y) point at the given t value.
    */
    pointAt(t) {
        const co = this.coefficients();
        const x = co.ax * t ** 2 + co.bx * t + co.cx;
        const y = co.ay * t ** 2 + co.by * t + co.cy;
        return { x, y };
    }

    /*
    Returns true if the slope at t is <1 and the given point is to the right of
    B(t),  or if the slope is >1 and the point is above B(t). False otherwise.
    */
    pointIsDownOrBelowAt(t, point) {
        const pointOnCurve = this.pointAt(t);
        const m = this.slopeAt(t);
        const isRight = Math.abs(m) > 1 && point.x > pointOnCurve.x;
        const isAbove = Math.abs(m) < 1 && point.y < pointOnCurve.y;
        return !(isRight || isAbove);
    }

    /*
    Retruns the slope at the given t value.
    */
    slopeAt(t) {
        const co = this.coefficients();
        const dx = 2 * co.ax * t + co.bx;
        const dy = 2 * co.ay * t + co.by;
        return dy / dx;
    }

    /*
    Returns the d string for drawing the curve as an svg path.
    For instance, given p0 = (x0, y0), p1 = (x1, y1), and p2 = (x2, y2),
    <path d="M x0 y0 Q x1 y1 x2 x2" />
    */
    svgPathString() {
        const { p0, p1, p2 } = this.controlPoints();
        return `M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`;
    }

    // ************************************************************************
    /* Static methods */
    // ************************************************************************

    /*
    Returns a Qbezier object given an svg path d-string.
    For example, a valid path is: <path d="M 100,250 Q 250,100 400,250" />.
    */
    static fromSvgPathString(dString) {
        const dParts = dString.split(' ');
        const p0String = dParts[1].split(',');
        const p1String = dParts[3].split(',');
        const p2String = dParts[4].split(',');
        const p0 = {
            x: parseFloat(p0String[0]),
            y: parseFloat(p0String[1])
        };
        const p1 = {
            x: parseFloat(p1String[0]),
            y: parseFloat(p1String[1])
        };
        const p2 = {
            x: parseFloat(p2String[0]),
            y: parseFloat(p2String[1])
        };
        return new Qbezier(p0, p1, p2);
    }
}
