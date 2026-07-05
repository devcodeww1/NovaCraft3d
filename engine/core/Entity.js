/**
 * NovaCraft Engine — Entity
 * Base game object; a named container for components.
 */
let _entityIdCounter = 0;

class Entity extends EventEmitter {
  constructor(name = 'Entity') {
    super();
    this.id         = ++_entityIdCounter;
    this.name       = name;
    this.tag        = 'default';
    this.layer      = 0;
    this.active     = true;
    this.transform  = new Transform();
    this.components = new Map();
    this.children   = [];
    this.parent     = null;
    this._scene     = null;
    this._started   = false;
  }

  // ── Component API ─────────────────────────────────────────
  addComponent(component) {
    const type = component.constructor.name;
    component.entity = this;
    this.components.set(type, component);
    if (component.onAttach) component.onAttach();
    return component;
  }

  getComponent(TypeOrName) {
    const name = typeof TypeOrName === 'string' ? TypeOrName : TypeOrName.name;
    return this.components.get(name) || null;
  }

  hasComponent(TypeOrName) {
    return !!this.getComponent(TypeOrName);
  }

  removeComponent(TypeOrName) {
    const name = typeof TypeOrName === 'string' ? TypeOrName : TypeOrName.name;
    const comp = this.components.get(name);
    if (comp) {
      if (comp.onDetach) comp.onDetach();
      this.components.delete(name);
    }
    return this;
  }

  // ── Hierarchy ─────────────────────────────────────────────
  addChild(entity) {
    entity.parent = this;
    entity.transform.setParent(this.transform);
    this.children.push(entity);
    if (this._scene) this._scene._registerEntity(entity);
    return entity;
  }

  removeChild(entity) {
    this.children = this.children.filter(c => c !== entity);
    entity.parent = null;
    entity.transform.setParent(null);
  }

  // ── Lifecycle ─────────────────────────────────────────────
  start() {
    if (this._started) return;
    this._started = true;
    this.components.forEach(c => { if (c.onStart) c.onStart(); });
    this.children.forEach(ch => ch.start());
    this.emit('start');
  }

  update(dt) {
    if (!this.active) return;
    this.components.forEach(c => { if (c.onUpdate) c.onUpdate(dt); });
    this.children.forEach(ch => ch.update(dt));
    this.emit('update', dt);
  }

  destroy() {
    this.active = false;
    this.components.forEach(c => { if (c.onDestroy) c.onDestroy(); });
    this.emit('destroy');
    if (this._scene) this._scene.destroyEntity(this);
  }

  // ── Serialization ─────────────────────────────────────────
  serialize() {
    const comps = {};
    this.components.forEach((c, k) => {
      if (c.serialize) comps[k] = c.serialize();
    });
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      layer: this.layer,
      active: this.active,
      transform: this.transform.serialize(),
      components: comps,
      children: this.children.map(c => c.serialize()),
      script: this.script || ''
    };
  }

  static deserialize(data, scene) {
    const e = new Entity(data.name);
    e.tag    = data.tag   || 'default';
    e.layer  = data.layer || 0;
    e.active = data.active !== false;
    e.transform = Transform.deserialize(data.transform);
    e.script = data.script || '';
    // components are re-attached by the scene loader
    return e;
  }
}
