/**
 * NovaCraft 3D Engine — PhysicsSystem
 * Simple 3D AABB + Sphere collision detection and resolution.
 */
class PhysicsSystem {
  constructor() {
    this.gravity = new THREE.Vector3(0, -9.81, 0);
    this.iterations = 2; // Collision solver iterations
  }

  update(scene, dt, engine) {
    const entities = scene.entities.filter(e => e.active);

    // 1. Integrate rigid body velocities and positions
    entities.forEach(e => {
      const rb = e.getComponent('RigidBody');
      if (!rb || !rb.enabled) return;

      if (!rb.isStatic) {
        // Apply gravity
        if (rb.useGravity) {
          rb.velocity.addScaledVector(this.gravity, rb.gravityScale * dt);
        }
        
        // Apply linear drag
        rb.velocity.multiplyScalar(Math.pow(1 - rb.drag, dt));

        // Apply velocities to transforms
        e.transform.position.addScaledVector(rb.velocity, dt);

        // Apply angular drag & velocities
        rb.angularVelocity.multiplyScalar(Math.pow(1 - rb.angularDrag, dt));
        e.transform.rotation.x += rb.angularVelocity.x * dt;
        e.transform.rotation.y += rb.angularVelocity.y * dt;
        e.transform.rotation.z += rb.angularVelocity.z * dt;
      }
    });

    // 2. Resolve Collisions
    for (let i = 0; i < this.iterations; i++) {
      for (let a = 0; a < entities.length; a++) {
        for (let b = a + 1; b < entities.length; b++) {
          this._collide(entities[a], entities[b]);
        }
      }
    }
  }

  _collide(ea, eb) {
    const ca = ea.getComponent('BoxCollider') || ea.getComponent('CircleCollider');
    const cb = eb.getComponent('BoxCollider') || eb.getComponent('CircleCollider');
    if (!ca || !cb) return;

    // Trigger check
    if (ca.isTrigger || cb.isTrigger) {
      if (this._testOverlap(ea, ca, eb, cb)) {
        ea.emit('trigger', eb);
        eb.emit('trigger', ea);
      }
      return;
    }

    const mtv = this._getMTV(ea, ca, eb, cb);
    if (!mtv) return;

    const rba = ea.getComponent('RigidBody');
    const rbb = eb.getComponent('RigidBody');

    // Total inverse mass for collision response
    const invMassA = (rba && !rba.isStatic) ? 1 / rba.mass : 0;
    const invMassB = (rbb && !rbb.isStatic) ? 1 / rbb.mass : 0;
    const totalInvMass = invMassA + invMassB;
    if (totalInvMass === 0) return;

    // 1. Positional correction (prevents sinking/clipping)
    const percent = 0.8; // penetration percentage to resolve
    const slop = 0.01; // penetration allowance
    const penetration = mtv.length();
    if (penetration > slop) {
      const correction = mtv.clone().normalize().multiplyScalar((penetration - slop) / totalInvMass * percent);
      if (rba && !rba.isStatic) ea.transform.position.subScaledVector(correction, invMassA);
      if (rbb && !rbb.isStatic) eb.transform.position.addScaledVector(correction, invMassB);
    }

    // 2. Velocity response (impulse resolution)
    const normal = mtv.clone().normalize();
    const velA = rba ? rba.velocity : new THREE.Vector3();
    const velB = rbb ? rbb.velocity : new THREE.Vector3();
    const relVel = new THREE.Vector3().subVectors(velB, velA);
    const velAlongNormal = relVel.dot(normal);

    // Only resolve if velocities are moving towards each other
    if (velAlongNormal < 0) {
      const bounciness = Math.min(rba ? rba.bounciness : 0.1, rbb ? rbb.bounciness : 0.1);
      const j = -(1 + bounciness) * velAlongNormal / totalInvMass;
      
      const impulse = normal.clone().multiplyScalar(j);
      if (rba && !rba.isStatic) {
        rba.velocity.subScaledVector(impulse, invMassA);
        // Ground detection: if normal points up, entity A is landed on top of entity B
        if (normal.y > 0.5) rba.isGrounded = true;
      }
      if (rbb && !rbb.isStatic) {
        rbb.velocity.addScaledVector(impulse, invMassB);
        // Ground detection: if normal points down, entity B is landed on top of entity A
        if (normal.y < -0.5) rbb.isGrounded = true;
      }

      // 3. Friction impulse
      const friction = Math.sqrt(rba ? rba.friction : 0.3, rbb ? rbb.friction : 0.3);
      const tangent = new THREE.Vector3().subVectors(relVel, normal.clone().multiplyScalar(velAlongNormal));
      if (tangent.lengthSq() > 0.0001) {
        tangent.normalize();
        const jt = -relVel.dot(tangent) / totalInvMass;
        const fImpulse = tangent.multiplyScalar(Math.min(Math.abs(jt), j * friction) * Math.sign(jt));
        
        if (rba && !rba.isStatic) rba.velocity.subScaledVector(fImpulse, invMassA);
        if (rbb && !rbb.isStatic) rbb.velocity.addScaledVector(fImpulse, invMassB);
      }
    }

    ea.emit('collision', eb);
    eb.emit('collision', ea);
  }

  _testOverlap(ea, ca, eb, cb) {
    return !!this._getMTV(ea, ca, eb, cb);
  }

  _getMTV(ea, ca, eb, cb) {
    const typeA = ca.constructor.name;
    const typeB = cb.constructor.name;

    if (typeA === 'CircleCollider' && typeB === 'CircleCollider') {
      // Sphere vs Sphere
      return this._sphereVsSphere(ea, ca, eb, cb);
    } else if (typeA === 'CircleCollider') {
      // Sphere vs Box
      return this._sphereVsBox(ea, ca, eb, cb);
    } else if (typeB === 'CircleCollider') {
      // Box vs Sphere (swap normal)
      const mtv = this._sphereVsBox(eb, cb, ea, ca);
      return mtv ? mtv.clone().negate() : null;
    } else {
      // Box vs Box (AABB vs AABB)
      return this._boxVsBox(ea, ca, eb, cb);
    }
  }

  _getAABB(entity, collider) {
    const pos = entity.transform.position;
    const scale = entity.transform.scale;
    const w = (collider.width ?? 1) * scale.x;
    const h = (collider.height ?? 1) * scale.y;
    const d = (collider.depth ?? 1) * scale.z;
    const cx = pos.x + (collider.offsetX ?? 0);
    const cy = pos.y + (collider.offsetY ?? 0);
    const cz = pos.z + (collider.offsetZ ?? 0);
    
    return {
      min: new THREE.Vector3(cx - w/2, cy - h/2, cz - d/2),
      max: new THREE.Vector3(cx + w/2, cy + h/2, cz + d/2),
      center: new THREE.Vector3(cx, cy, cz),
      size: new THREE.Vector3(w, h, d)
    };
  }

  _boxVsBox(ea, ca, eb, cb) {
    const a = this._getAABB(ea, ca);
    const b = this._getAABB(eb, cb);

    const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);

    if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return null;

    // Minimum Translation Vector is along the axis of minimum penetration
    const diff = new THREE.Vector3().subVectors(b.center, a.center);
    if (overlapX < overlapY && overlapX < overlapZ) {
      return new THREE.Vector3(diff.x < 0 ? -overlapX : overlapX, 0, 0);
    } else if (overlapY < overlapZ) {
      return new THREE.Vector3(0, diff.y < 0 ? -overlapY : overlapY, 0);
    } else {
      return new THREE.Vector3(0, 0, diff.z < 0 ? -overlapZ : overlapZ);
    }
  }

  _sphereVsSphere(ea, ca, eb, cb) {
    const pa = new THREE.Vector3().copy(ea.transform.position).add(new THREE.Vector3(ca.offsetX || 0, ca.offsetY || 0, ca.offsetZ || 0));
    const pb = new THREE.Vector3().copy(eb.transform.position).add(new THREE.Vector3(cb.offsetX || 0, cb.offsetY || 0, cb.offsetZ || 0));
    
    const scaleA = Math.max(ea.transform.scale.x, ea.transform.scale.y, ea.transform.scale.z);
    const scaleB = Math.max(eb.transform.scale.x, eb.transform.scale.y, eb.transform.scale.z);
    const rA = ca.radius * scaleA;
    const rB = cb.radius * scaleB;

    const diff = new THREE.Vector3().subVectors(pb, pa);
    const dist = diff.length();
    const minDist = rA + rB;
    if (dist >= minDist) return null;

    if (dist > 0.0001) {
      return diff.normalize().multiplyScalar(minDist - dist);
    } else {
      return new THREE.Vector3(0, minDist, 0); // fallback projection upward
    }
  }

  _sphereVsBox(ec, cc, eb, cb) {
    const cp = new THREE.Vector3().copy(ec.transform.position).add(new THREE.Vector3(cc.offsetX || 0, cc.offsetY || 0, cc.offsetZ || 0));
    const scaleC = Math.max(ec.transform.scale.x, ec.transform.scale.y, ec.transform.scale.z);
    const r = cc.radius * scaleC;

    const box = this._getAABB(eb, cb);

    // Closest point on AABB to sphere center
    const closest = new THREE.Vector3(
      Math.max(box.min.x, Math.min(cp.x, box.max.x)),
      Math.max(box.min.y, Math.min(cp.y, box.max.y)),
      Math.max(box.min.z, Math.min(cp.z, box.max.z))
    );

    const diff = new THREE.Vector3().subVectors(cp, closest);
    const dist = diff.length();
    if (dist >= r) return null;

    if (dist > 0.0001) {
      return diff.normalize().multiplyScalar(r - dist).negate();
    } else {
      // Sphere center is inside AABB. Project out along the shallowest axis
      const overlapX = Math.min(cp.x - box.min.x, box.max.x - cp.x);
      const overlapY = Math.min(cp.y - box.min.y, box.max.y - cp.y);
      const overlapZ = Math.min(cp.z - box.min.z, box.max.z - cp.z);
      
      const normal = new THREE.Vector3().subVectors(closest, box.center);
      if (overlapX < overlapY && overlapX < overlapZ) {
        return new THREE.Vector3(normal.x < 0 ? -r - overlapX : r + overlapX, 0, 0);
      } else if (overlapY < overlapZ) {
        return new THREE.Vector3(0, normal.y < 0 ? -r - overlapY : r + overlapY, 0);
      } else {
        return new THREE.Vector3(0, 0, normal.z < 0 ? -r - overlapZ : r + overlapZ);
      }
    }
  }
}
