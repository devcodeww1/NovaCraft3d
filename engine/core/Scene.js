/**
 * NovaCraft Engine — Scene
 * Manages a collection of entities and system pipelines.
 */
class Scene extends EventEmitter {
  constructor(name = 'Scene') {
    super();
    this.name     = name;
    this.entities = [];
    this._toDestroy = [];
    this.backgroundColor = '#0f0f1a';
    this.width    = 1280;
    this.height   = 720;
  }

  // ── Entity management ─────────────────────────────────────
  addEntity(entity) {
    entity._scene = this;
    this.entities.push(entity);
    this.emit('entityAdded', entity);
    return entity;
  }

  createEntity(name = 'Entity') {
    const e = new Entity(name);
    return this.addEntity(e);
  }

  destroyEntity(entity) {
    this._toDestroy.push(entity);
  }

  _registerEntity(entity) {
    entity._scene = this;
    // children already registered via addChild
  }

  getEntityById(id) {
    return this.entities.find(e => e.id === id) || null;
  }

  getEntityByName(name) {
    return this.entities.find(e => e.name === name) || null;
  }

  getEntitiesByTag(tag) {
    return this.entities.filter(e => e.tag === tag);
  }

  // ── Flush destroyed entities ──────────────────────────────
  _flushDestroyed() {
    if (!this._toDestroy.length) return;
    this._toDestroy.forEach(e => {
      this.entities = this.entities.filter(x => x !== e);
      this.emit('entityRemoved', e);
    });
    this._toDestroy = [];
  }

  // ── Serialization ─────────────────────────────────────────
  serialize() {
    return {
      name: this.name,
      backgroundColor: this.backgroundColor,
      width: this.width,
      height: this.height,
      entities: this.entities.map(e => e.serialize())
    };
  }

  static deserialize(data) {
    const scene = new Scene(data.name);
    scene.backgroundColor = data.backgroundColor || '#0f0f1a';
    scene.width  = data.width  || 1280;
    scene.height = data.height || 720;
    (data.entities || []).forEach(ed => {
      const e = Entity.deserialize(ed, scene);
      // Reattach components
      const cd = ed.components || {};
      Object.entries(cd).forEach(([type, cdata]) => {
        const Ctor = ComponentRegistry[type];
        if (Ctor) {
          const comp = Ctor.deserialize ? Ctor.deserialize(cdata) : new Ctor();
          e.addComponent(comp);
        }
      });
      scene.addEntity(e);
    });
    return scene;
  }
}
