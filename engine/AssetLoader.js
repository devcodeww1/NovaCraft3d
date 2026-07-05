/**
 * NovaCraft Engine — AssetLoader
 * Loads images, audio buffers, JSON, and generates procedural assets.
 */
class AssetLoader {
  constructor() {
    this._cache = new Map();
    this._loading = new Map();
  }

  // Load image
  image(src) {
    if (this._cache.has(src)) return Promise.resolve(this._cache.get(src));
    if (this._loading.has(src)) return this._loading.get(src);

    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => { this._cache.set(src, img); resolve(img); };
      img.onerror = () => reject(new Error(`AssetLoader: Failed to load image ${src}`));
      img.src = src;
    });
    this._loading.set(src, p);
    return p;
  }

  // Load audio buffer
  audio(src, audioCtx) {
    if (this._cache.has(src)) return Promise.resolve(this._cache.get(src));
    return fetch(src)
      .then(r => r.arrayBuffer())
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => { this._cache.set(src, decoded); return decoded; });
  }

  // Load JSON
  json(src) {
    if (this._cache.has(src)) return Promise.resolve(this._cache.get(src));
    return fetch(src).then(r => r.json()).then(data => { this._cache.set(src, data); return data; });
  }

  // Generate procedural colored canvas texture
  generateColor(color, w = 32, h = 32) {
    const key = `gen:${color}:${w}x${h}`;
    if (this._cache.has(key)) return this._cache.get(key);
    const c  = document.createElement('canvas');
    c.width  = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    this._cache.set(key, c);
    return c;
  }

  // Generate gradient texture
  generateGradient(c1, c2, w = 32, h = 32, vertical = true) {
    const key = `grad:${c1}:${c2}:${w}x${h}:${vertical}`;
    if (this._cache.has(key)) return this._cache.get(key);
    const c  = document.createElement('canvas');
    c.width  = w; c.height = h;
    const ctx = c.getContext('2d');
    const grad = vertical
      ? ctx.createLinearGradient(0, 0, 0, h)
      : ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    this._cache.set(key, c);
    return c;
  }

  get(key) { return this._cache.get(key) || null; }
  has(key)  { return this._cache.has(key); }
  clear()   { this._cache.clear(); this._loading.clear(); }
}

// Global singleton
const Assets = new AssetLoader();
