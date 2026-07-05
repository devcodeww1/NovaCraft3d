/**
 * NovaCraft 3D Engine — AnimationSystem
 * Updates particle systems and tweens.
 */
class AnimationSystem {
  constructor() {
    this._tweens = [];
  }

  update(scene, dt, engine) {
    // 1. Update active ParticleEmitters
    scene.entities.forEach(e => {
      if (!e.active) return;
      const pe = e.getComponent('ParticleEmitter');
      if (pe && pe.enabled) {
        this._updateParticles(pe, dt);
      }
    });

    // 2. Update active tweens
    this._tweens = this._tweens.filter(t => {
      t.elapsed += dt;
      const p = Math.min(t.elapsed / t.duration, 1);
      const ep = t.easing(p);
      t.target[t.prop] = t.from + (t.to - t.from) * ep;
      if (p >= 1) {
        if (t.onComplete) t.onComplete();
        return false;
      }
      return true;
    });
  }

  _updateParticles(pe, dt) {
    // Spawn new particles
    if (pe.emitting) {
      pe._acc += pe.rate * dt;
      while (pe._acc >= 1) {
        pe._acc--;
        
        // Spawn within unit sphere around entity position
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const vx = Math.sin(phi) * Math.cos(theta) * pe.speed;
        const vy = Math.cos(phi) * pe.speed;
        const vz = Math.sin(phi) * Math.sin(theta) * pe.speed;

        pe.particles.push({
          position: new THREE.Vector3().copy(pe.entity.transform.position),
          velocity: new THREE.Vector3(vx, vy, vz),
          life: 0,
          maxLife: pe.lifetime * (0.8 + Math.random() * 0.4)
        });
      }
    }

    // Update existing particles
    pe.particles = pe.particles.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;

      // Apply gravity
      p.velocity.y += pe.gravity * dt;
      
      // Update position
      p.position.addScaledVector(p.velocity, dt);
      return true;
    });
  }

  // Linear tween function for generic properties
  tween(target, prop, to, duration, easing = Easing.linear, onComplete) {
    this._tweens.push({
      target, prop, to,
      from: target[prop],
      duration, elapsed: 0,
      easing, onComplete
    });
  }
}

const Easing = {
  linear:    t => t,
  easeIn:    t => t * t,
  easeOut:   t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t
};
