/**
 * NovaCraft 3D Engine — Components
 * ECS Component definitions for 3D physics, rendering, cameras, and lights.
 */

class Component {
  constructor() {
    this.entity  = null;
    this.enabled = true;
  }
  onAttach()  {}
  onDetach()  {}
  onStart()   {}
  onUpdate(dt) {}
  onDestroy() {}
  serialize() { return {}; }
  static deserialize(data) { return new this(); }
}

// ── RigidBody (3D) ────────────────────────────────────────────
class RigidBody extends Component {
  constructor() {
    super();
    this.velocity        = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.mass            = 1;
    this.drag            = 0.01;
    this.angularDrag     = 0.05;
    this.bounciness      = 0.1;
    this.friction        = 0.3;
    this.gravityScale    = 1;
    this.useGravity      = true;
    this.isStatic        = false;
    this.isGrounded      = false;
  }

  addForce(f) {
    if (this.isStatic) return;
    this.velocity.addScaledVector(f, 1 / this.mass);
  }

  addImpulse(impulse) {
    if (this.isStatic) return;
    this.velocity.add(impulse);
  }

  serialize() {
    return {
      mass: this.mass,
      drag: this.drag,
      bounciness: this.bounciness,
      friction: this.friction,
      gravityScale: this.gravityScale,
      useGravity: this.useGravity,
      isStatic: this.isStatic
    };
  }

  static deserialize(d) {
    const c = new RigidBody();
    Object.assign(c, d);
    c.velocity = new THREE.Vector3(0, 0, 0);
    c.angularVelocity = new THREE.Vector3(0, 0, 0);
    return c;
  }
}

// ── BoxCollider (3D) ──────────────────────────────────────────
class BoxCollider extends Component {
  constructor(w = 1, h = 1, d = 1) {
    super();
    this.width = w;
    this.height = h;
    this.depth = d;
    this.offsetX = 0;
    this.offsetY = 0;
    this.offsetZ = 0;
    this.isTrigger = false;
  }

  serialize() {
    return {
      width: this.width,
      height: this.height,
      depth: this.depth,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      offsetZ: this.offsetZ,
      isTrigger: this.isTrigger
    };
  }

  static deserialize(d) {
    const c = new BoxCollider();
    Object.assign(c, d);
    return c;
  }
}

// ── SphereCollider (3D) ───────────────────────────────────────
class CircleCollider extends Component {
  constructor(r = 0.5) {
    super();
    this.radius = r;
    this.offsetX = 0;
    this.offsetY = 0;
    this.offsetZ = 0;
    this.isTrigger = false;
  }

  serialize() {
    return {
      radius: this.radius,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      offsetZ: this.offsetZ,
      isTrigger: this.isTrigger
    };
  }

  static deserialize(d) {
    const c = new CircleCollider();
    Object.assign(c, d);
    return c;
  }
}
// Alias for editor menu
const SphereCollider = CircleCollider;

// ── MeshRenderer (3D) ─────────────────────────────────────────
class MeshRenderer extends Component {
  constructor() {
    super();
    this.type = 'box'; // 'box' | 'sphere' | 'cylinder' | 'plane' | 'cone' | 'torus'
    this.color = '#a78bfa';
    this.roughness = 0.2;
    this.metalness = 0.5;
    this.opacity = 1.0;
    this.emissive = '#000000';
    this.castShadow = true;
    this.receiveShadow = true;
    
    // Internal WebGL Mesh link
    this._mesh = null;
  }

  serialize() {
    return {
      type: this.type,
      color: this.color,
      roughness: this.roughness,
      metalness: this.metalness,
      opacity: this.opacity,
      emissive: this.emissive,
      castShadow: this.castShadow,
      receiveShadow: this.receiveShadow
    };
  }

  static deserialize(d) {
    const c = new MeshRenderer();
    Object.assign(c, d);
    return c;
  }
}
// Legacy alias so that bootstrap code referencing Sprite loads MeshRenderer instead
const Sprite = MeshRenderer;
const ShapeRenderer = MeshRenderer;

// ── Camera (3D Perspective) ───────────────────────────────────
class Camera extends Component {
  constructor() {
    super();
    this.isMain = true;
    this.fov = 60;
    this.followTarget = null; // String name of entity
    this.followOffset = new THREE.Vector3(0, 5, 10);
    this.followLerp = 4.0;
  }

  serialize() {
    return {
      isMain: this.isMain,
      fov: this.fov,
      followTarget: this.followTarget,
      offsetX: this.followOffset.x,
      offsetY: this.followOffset.y,
      offsetZ: this.followOffset.z,
      followLerp: this.followLerp
    };
  }

  static deserialize(d) {
    const c = new Camera();
    c.isMain = d.isMain ?? true;
    c.fov = d.fov ?? 60;
    c.followTarget = d.followTarget || null;
    c.followOffset.set(d.offsetX ?? 0, d.offsetY ?? 5, d.offsetZ ?? 10);
    c.followLerp = d.followLerp ?? 4.0;
    return c;
  }
}

// ── PointLight (3D) ───────────────────────────────────────────
class PointLight extends Component {
  constructor() {
    super();
    this.color = '#ffffff';
    this.intensity = 2.0;
    this.distance = 15;
    this.decay = 2;
    this.castShadow = true;
    
    this._light = null;
  }

  serialize() {
    return {
      color: this.color,
      intensity: this.intensity,
      distance: this.distance,
      decay: this.decay,
      castShadow: this.castShadow
    };
  }

  static deserialize(d) {
    const c = new PointLight();
    Object.assign(c, d);
    return c;
  }
}

// ── DirectionalLight (3D) ─────────────────────────────────────
class DirectionalLight extends Component {
  constructor() {
    super();
    this.color = '#ffffff';
    this.intensity = 1.5;
    this.castShadow = true;
    
    this._light = null;
  }

  serialize() {
    return {
      color: this.color,
      intensity: this.intensity,
      castShadow: this.castShadow
    };
  }

  static deserialize(d) {
    const c = new DirectionalLight();
    Object.assign(c, d);
    return c;
  }
}

// ── ParticleEmitter (3D) ──────────────────────────────────────
class ParticleEmitter extends Component {
  constructor() {
    super();
    this.emitting = true;
    this.rate = 30; // particles per sec
    this.lifetime = 1.5;
    this.speed = 4.0;
    this.startSize = 0.2;
    this.endSize = 0.01;
    this.startColor = '#38bdf8';
    this.endColor = '#a78bfa';
    this.gravity = -2.0;
    
    this.particles = [];
    this._acc = 0;
    this._points = null; // Internal Three.js Points object
  }

  burst(count = 25) {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const vx = Math.sin(phi) * Math.cos(theta) * this.speed;
      const vy = Math.cos(phi) * this.speed;
      const vz = Math.sin(phi) * Math.sin(theta) * this.speed;
      
      this.particles.push({
        position: new THREE.Vector3().copy(this.entity.transform.position),
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: this.lifetime * (0.8 + Math.random() * 0.4)
      });
    }
  }

  serialize() {
    return {
      emitting: this.emitting,
      rate: this.rate,
      lifetime: this.lifetime,
      speed: this.speed,
      startSize: this.startSize,
      endSize: this.endSize,
      startColor: this.startColor,
      endColor: this.endColor,
      gravity: this.gravity
    };
  }

  static deserialize(d) {
    const c = new ParticleEmitter();
    Object.assign(c, d);
    return c;
  }
}

// ── TextRenderer (3D billboard text) ──────────────────────────
class TextRenderer extends Component {
  constructor(text = "Hello 3D") {
    super();
    this.text = text;
    this.fontSize = 48;
    this.color = '#ffffff';
    this._sprite = null;
  }

  serialize() {
    return {
      text: this.text,
      fontSize: this.fontSize,
      color: this.color
    };
  }

  static deserialize(d) {
    const c = new TextRenderer();
    Object.assign(c, d);
    return c;
  }
}

// ── Animator ──────────────────────────────────────────────────
class Animator extends Component {
  constructor() {
    super();
    this.enabled = false;
  }
  serialize() { return { enabled: this.enabled }; }
  static deserialize(d) { return new Animator(); }
}

// ── Tilemap (Stub in 3D) ──────────────────────────────────────
class Tilemap extends Component {
  constructor() {
    super();
    this.enabled = false;
  }
  serialize() { return { enabled: this.enabled }; }
  static deserialize(d) { return new Tilemap(); }
}

// Component Registry
const ComponentRegistry = {
  RigidBody, BoxCollider, CircleCollider,
  MeshRenderer, Sprite, ShapeRenderer,
  Camera, PointLight, DirectionalLight,
  ParticleEmitter, TextRenderer, Animator, Tilemap
};
