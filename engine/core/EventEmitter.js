/**
 * NovaCraft Engine — EventEmitter
 * Lightweight pub/sub system used throughout the engine.
 */
class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, fn, ctx) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push({ fn, ctx });
    return this;
  }

  off(event, fn) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter(l => l.fn !== fn);
    return this;
  }

  once(event, fn, ctx) {
    const wrapper = (...args) => { fn.apply(ctx, args); this.off(event, wrapper); };
    return this.on(event, wrapper, ctx);
  }

  emit(event, ...args) {
    const listeners = this._listeners[event];
    if (!listeners) return this;
    listeners.slice().forEach(l => l.fn.apply(l.ctx, args));
    return this;
  }

  removeAllListeners(event) {
    if (event) delete this._listeners[event];
    else this._listeners = {};
    return this;
  }
}
