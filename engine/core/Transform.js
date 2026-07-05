/**
 * NovaCraft 3D Engine — Transform
 * Represents 3D position, rotation (Euler), and scale.
 */
class Transform {
  constructor(x = 0, y = 0, z = 0) {
    this.position = new THREE.Vector3(x, y, z);
    this.rotation = new THREE.Euler(0, 0, 0); // yaw, pitch, roll in radians
    this.scale    = new THREE.Vector3(1, 1, 1);
    this.parent   = null;
    this._children = [];
  }

  translate(dx, dy, dz) {
    this.position.x += dx;
    this.position.y += dy;
    this.position.z += dz;
  }

  rotate(rx, ry, rz) {
    this.rotation.x += rx;
    this.rotation.y += ry;
    this.rotation.z += rz;
  }

  lookAt(targetVec) {
    // Simple lookAt utility
    const m = new THREE.Matrix4();
    m.lookAt(targetVec, this.position, new THREE.Vector3(0, 1, 0));
    this.rotation.setFromRotationMatrix(m);
  }

  clone() {
    const t = new Transform(this.position.x, this.position.y, this.position.z);
    t.rotation.copy(this.rotation);
    t.scale.copy(this.scale);
    return t;
  }

  serialize() {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      rx: this.rotation.x,
      ry: this.rotation.y,
      rz: this.rotation.z,
      sx: this.scale.x,
      sy: this.scale.y,
      sz: this.scale.z
    };
  }

  static deserialize(d) {
    const t = new Transform(d.x || 0, d.y || 0, d.z || 0);
    t.rotation.set(d.rx || 0, d.ry || 0, d.rz || 0);
    t.scale.set(d.sx ?? 1, d.sy ?? 1, d.sz ?? 1);
    return t;
  }
}
