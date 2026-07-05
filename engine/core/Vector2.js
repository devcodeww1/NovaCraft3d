/**
 * NovaCraft Engine — Vector2
 * Immutable-friendly 2D vector with full math API.
 */
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // ── Factory ──────────────────────────────────────────────
  static zero()  { return new Vector2(0, 0); }
  static one()   { return new Vector2(1, 1); }
  static up()    { return new Vector2(0, -1); }
  static down()  { return new Vector2(0, 1); }
  static left()  { return new Vector2(-1, 0); }
  static right() { return new Vector2(1, 0); }
  static fromAngle(rad) { return new Vector2(Math.cos(rad), Math.sin(rad)); }
  static lerp(a, b, t)  { return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }

  // ── Instance math ─────────────────────────────────────────
  clone()              { return new Vector2(this.x, this.y); }
  add(v)               { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v)               { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s)               { return new Vector2(this.x * s, this.y * s); }
  div(s)               { return new Vector2(this.x / s, this.y / s); }
  dot(v)               { return this.x * v.x + this.y * v.y; }
  cross(v)             { return this.x * v.y - this.y * v.x; }
  length()             { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq()           { return this.x * this.x + this.y * this.y; }
  distanceTo(v)        { return this.sub(v).length(); }
  distanceToSq(v)      { const dx = this.x-v.x, dy = this.y-v.y; return dx*dx+dy*dy; }
  normalize()          { const l = this.length(); return l > 0 ? this.div(l) : Vector2.zero(); }
  negate()             { return new Vector2(-this.x, -this.y); }
  perpendicular()      { return new Vector2(-this.y, this.x); }
  rotate(rad)          {
    const c = Math.cos(rad), s = Math.sin(rad);
    return new Vector2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
  angle()              { return Math.atan2(this.y, this.x); }
  angleTo(v)           { return Math.atan2(v.y - this.y, v.x - this.x); }
  reflect(normal)      { return this.sub(normal.mul(2 * this.dot(normal))); }
  clampLength(max)     { const l = this.length(); return l > max ? this.normalize().mul(max) : this.clone(); }
  floor()              { return new Vector2(Math.floor(this.x), Math.floor(this.y)); }
  ceil()               { return new Vector2(Math.ceil(this.x), Math.ceil(this.y)); }
  round()              { return new Vector2(Math.round(this.x), Math.round(this.y)); }
  abs()                { return new Vector2(Math.abs(this.x), Math.abs(this.y)); }
  equals(v, eps=0.001) { return Math.abs(this.x-v.x) < eps && Math.abs(this.y-v.y) < eps; }
  toArray()            { return [this.x, this.y]; }
  toString()           { return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`; }

  // Mutating variants (prefixed with i for in-place)
  iAdd(v)  { this.x += v.x; this.y += v.y; return this; }
  iSub(v)  { this.x -= v.x; this.y -= v.y; return this; }
  iMul(s)  { this.x *= s;   this.y *= s;   return this; }
  iSet(x, y) { this.x = x; this.y = y; return this; }
}
