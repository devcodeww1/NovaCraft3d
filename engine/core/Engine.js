/**
 * NovaCraft 3D Engine — Engine
 * Central coordinator: owns the game loop, systems, and scene stack.
 */
class Engine extends EventEmitter {
  constructor(containerId) {
    super();
    this.container = document.getElementById(containerId);
    this.scene     = null;
    this.running   = false;
    this.paused    = false;
    this._lastTime = 0;
    this._raf      = null;
    this.fps       = 0;
    this._fpsFrames = 0;
    this._fpsTime   = 0;

    // 3D Math Gravity
    this.gravity = new THREE.Vector3(0, -9.81, 0);

    // Systems
    this.input     = new InputSystem();
    this.physics   = new PhysicsSystem();
    this.renderer  = new RenderSystem(containerId);
    this.audio     = new AudioSystem();
    this.scripts   = new ScriptSystem();
    this.animation = new AnimationSystem();

    this.systems = [
      this.input,
      this.physics,
      this.animation,
      this.scripts,
      this.renderer
    ];
  }

  loadScene(scene) {
    this.scene = scene;
    
    // Set 3D gravity
    const gx = parseFloat(document.getElementById('gravityX')?.value ?? 0);
    const gy = parseFloat(document.getElementById('gravityY')?.value ?? -9.81);
    const gz = parseFloat(document.getElementById('gravityZ')?.value ?? 0);
    this.physics.gravity.set(gx, gy, gz);

    // Sync three.js visual objects
    this.renderer.initScene(scene);
    
    this.emit('sceneLoaded', scene);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused  = false;
    
    if (this.scene) {
      this.scene.entities.forEach(e => e.start());
    }
    
    this._lastTime = performance.now();
    this._loop(this._lastTime);
    this.emit('start');
  }

  pause() {
    this.paused = !this.paused;
    this.emit('pause', this.paused);
  }

  stop() {
    this.running = false;
    this.paused  = false;
    if (this._raf) { 
      cancelAnimationFrame(this._raf); 
      this._raf = null; 
    }
    if (this.scene) {
      this.scene.entities.forEach(e => { e._started = false; });
    }
    // Clean up rendering meshes
    this.renderer.clearScene();
    this.emit('stop');
  }

  _loop(now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(t => this._loop(t));

    const rawDt = (now - this._lastTime) / 1000;
    this._lastTime = now;
    const dt = Math.min(rawDt, 0.05); // cap at 50ms

    this._fpsFrames++;
    this._fpsTime += rawDt;
    if (this._fpsTime >= 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsTime);
      this._fpsFrames = 0;
      this._fpsTime = 0;
      this.emit('fps', this.fps);
    }

    if (this.paused) {
      if (this.scene) this.renderer.render(this.scene, dt);
      return;
    }

    if (this.scene) {
      this.systems.forEach(s => {
        if (s.update) s.update(this.scene, dt, this);
      });
      this.scene._flushDestroyed();
    }
  }
}
