/**
 * NovaCraft Engine — InputSystem
 * Tracks keyboard, mouse, and gamepad state.
 */
class InputSystem {
  constructor() {
    this._keys    = new Set();
    this._prevKeys = new Set();
    this._mouse   = { x: 0, y: 0, worldX: 0, worldY: 0, buttons: new Set(), prevButtons: new Set() };
    this._gamepads = [];

    window.addEventListener('keydown', e => {
      this._keys.add(e.code);
      this._keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', e => {
      this._keys.delete(e.code);
      this._keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('mousedown', e => this._mouse.buttons.add(e.button));
    window.addEventListener('mouseup',   e => this._mouse.buttons.delete(e.button));
    window.addEventListener('mousemove', e => {
      this._mouse.x = e.clientX;
      this._mouse.y = e.clientY;
    });
    window.addEventListener('gamepadconnected',    e => { this._gamepads[e.gamepad.index] = e.gamepad; });
    window.addEventListener('gamepaddisconnected', e => { delete this._gamepads[e.gamepad.index]; });
  }

  update(scene, dt, engine) {
    // Capture previous frame state
    this._prevKeys = new Set(this._keys);
    this._mouse.prevButtons = new Set(this._mouse.buttons);
    // Poll gamepads
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) this._gamepads[i] = pads[i];
    }
  }

  // Keyboard
  isDown(key)     { return this._keys.has(key); }
  isPressed(key)  { return this._keys.has(key) && !this._prevKeys.has(key); }
  isReleased(key) { return !this._keys.has(key) && this._prevKeys.has(key); }

  // Axis helpers
  axis(negKey, posKey) {
    return (this.isDown(posKey) ? 1 : 0) - (this.isDown(negKey) ? 1 : 0);
  }

  // Mouse
  get mouseX() { return this._mouse.x; }
  get mouseY() { return this._mouse.y; }
  get mouseWorldX() { return this._mouse.worldX; }
  get mouseWorldY() { return this._mouse.worldY; }
  mouseDown(btn = 0)     { return this._mouse.buttons.has(btn); }
  mousePressed(btn = 0)  { return this._mouse.buttons.has(btn) && !this._mouse.prevButtons.has(btn); }
  mouseReleased(btn = 0) { return !this._mouse.buttons.has(btn) && this._mouse.prevButtons.has(btn); }

  // Gamepad
  gamepadAxis(pad = 0, axis = 0) {
    return this._gamepads[pad]?.axes[axis] || 0;
  }
  gamepadButton(pad = 0, btn = 0) {
    return this._gamepads[pad]?.buttons[btn]?.pressed || false;
  }
}
