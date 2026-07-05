/**
 * NovaCraft 3D Engine — ScriptSystem
 * Compiles and runs per-entity JS scripts with sandbox API including Three.js math.
 */
class ScriptSystem {
  constructor() {
    this._compiled = new Map();
  }

  update(scene, dt, engine) {
    scene.entities.forEach(e => {
      if (!e.active || !e.script || !e.script.trim()) return;
      this._runScript(e, dt, engine);
    });
  }

  _runScript(entity, dt, engine) {
    try {
      if (!entity._scriptFns) {
        entity._scriptFns = this._compile(entity.script, entity, engine);
      }
      if (!entity._scriptStarted && entity._scriptFns.onStart) {
        entity._scriptFns.onStart.call({ entity, engine, THREE });
        entity._scriptStarted = true;
      }
      if (entity._scriptFns.onUpdate) {
        entity._scriptFns.onUpdate.call({ entity, engine, Engine: engine, THREE }, dt);
      }
    } catch (err) {
      if (!entity._scriptError) {
        console.error(`[Script] ${entity.name}: ${err.message}`);
        entity._scriptError = true;
      }
    }
  }

  _compile(code, entity, engine) {
    const api = {
      THREE,
      Vector3: THREE.Vector3,
      Euler: THREE.Euler,
      Entity,
      Scene,
      Math,
      console,
      input: engine.input,
      audio: engine.audio,
      scene: engine.scene
    };

    const fnBody = `
      "use strict";
      ${code}
      return { 
        onStart: typeof onStart !== 'undefined' ? onStart : null,
        onUpdate: typeof onUpdate !== 'undefined' ? onUpdate : null,
        onCollide: typeof onCollide !== 'undefined' ? onCollide : null 
      };
    `;

    const fn = new Function(...Object.keys(api), fnBody);
    return fn(...Object.values(api));
  }

  resetEntity(entity) {
    delete entity._scriptFns;
    delete entity._scriptStarted;
    delete entity._scriptError;
  }

  reset() {
    // Will compile next frame
  }
}
