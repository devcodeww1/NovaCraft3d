const Editor = {
  scene:    null,
  selected: null,
  engine:   null,
  playing:  false,
  _savedScene: null,
  _logCount: 0,

  init() {
    this.scene  = new Scene('Demo Platformer 3D');
    this.scene.backgroundColor = '#05050c';
    this.scene.width  = 1200;
    this.scene.height = 700;

    // Initialize 3D Engine on gameCanvas3D
    this.engine = new Engine('gameCanvas3D');
    window._gameEngine = this.engine;

    this.engine.on('fps', fps => {
      document.getElementById('fpsCounter').textContent = fps + ' FPS';
    });

    // Initialize 3D Viewport on editorCanvas3D
    Viewport.init('editorCanvas3D');

    this.refreshHierarchy();
    this.log('NovaCraft 3D Game Engine loaded!', 'success');
    this.log('Click: Scene → Load Demo Scene to see the 3D game.', 'info');

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'F5')  { e.preventDefault(); this.playing ? this.stop() : this.play(); }
      if (e.key === 'Delete') this.deleteSelected();
      if (e.code === 'KeyQ') this.setTool('select');
      if (e.code === 'KeyW') this.setTool('move');
      if (e.code === 'KeyE') this.setTool('scale');
      if (e.ctrlKey && e.code === 'KeyD') { e.preventDefault(); this.duplicateSelected(); }
      if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); this.saveScene(); }
    });

    // Loop inspector updates while playing
    setInterval(() => {
      if (this.selected && this.playing) Inspector.render(this.selected);
      if (!this.playing) Viewport.drawEditor();
    }, 50);

    document.getElementById('entityCount').textContent = '0 entities';
  },

  // ── Playback ──────────────────────────────────────────────
  play() {
    if (this.playing) return;
    this._savedScene = JSON.stringify(this.scene.serialize());
    this.playing = true;

    const gameCanvas = document.getElementById('gameCanvas3D');
    const editorCanvas = document.getElementById('editorCanvas3D');

    editorCanvas.classList.add('hidden');
    gameCanvas.classList.remove('hidden');
    document.getElementById('playOverlay').classList.remove('hidden');
    document.getElementById('btnPlay').classList.add('hidden');
    document.getElementById('btnPause').classList.remove('hidden');

    // Trigger canvas size sync after removing class 'hidden'
    this.engine.renderer.resize();

    // Load active scene into the engine renderer
    this.engine.loadScene(this.scene);
    this.engine.start();

    this.log('▶ 3D Physics & Script Simulation started', 'success');
    this.engine.audio.beep(520, 0.08, 'sine', 0.15);
  },

  pause() {
    if (!this.playing) return;
    this.engine.pause();
    const btn = document.getElementById('btnPause');
    btn.style.opacity = this.engine.paused ? '0.5' : '1';
    this.log(this.engine.paused ? '⏸ Paused' : '▶ Resumed', 'info');
  },

  stop() {
    if (!this.playing) return;
    this.engine.stop();
    this.playing = false;

    document.getElementById('gameCanvas3D').classList.add('hidden');
    document.getElementById('editorCanvas3D').classList.remove('hidden');
    document.getElementById('playOverlay').classList.add('hidden');
    document.getElementById('btnPlay').classList.remove('hidden');
    document.getElementById('btnPause').classList.add('hidden');

    // Restore state
    if (this._savedScene) {
      this.scene = Scene.deserialize(JSON.parse(this._savedScene));
      this._savedScene = null;
    }
    this.selected = null;
    this.refreshHierarchy();
    Inspector.render(null);
    Viewport.resize(); // Trigger editor canvas size sync after showing it again
    Viewport.drawEditor();
    this.log('■ Simulation stopped', 'warn');
    this.engine.audio.beep(260, 0.08, 'sine', 0.15);
  },

  // ── Entity management ─────────────────────────────────────
  addEntity(name = 'Entity') {
    const e = this.scene.createEntity(name);
    e.transform.position.set(
      (Math.random() - 0.5) * 5,
      1,
      (Math.random() - 0.5) * 5
    );
    this.select(e);
    this.refreshHierarchy();
    this.log(`Created entity: ${e.name}`, 'info');
    Viewport.drawEditor();
    return e;
  },

  addSpriteEntity() {
    const e = this.addEntity('3D Mesh Box');
    e.addComponent(new MeshRenderer());
    Inspector.render(e);
    Viewport.drawEditor();
    return e;
  },

  addPhysicsEntity() {
    const e = this.addEntity('Physics Sphere');
    const mr = new MeshRenderer();
    mr.type = 'sphere';
    mr.color = '#38bdf8';
    e.addComponent(mr);
    e.addComponent(new CircleCollider(0.5));
    e.addComponent(new RigidBody());
    this.select(e);
    Inspector.render(e);
    Viewport.drawEditor();
    return e;
  },

  addCameraEntity() {
    const e = this.addEntity('Perspective Camera');
    e.addComponent(new Camera());
    this.select(e);
    Inspector.render(e);
    Viewport.drawEditor();
    return e;
  },

  addTextEntity() {
    const e = this.addEntity('3D Billboard Text');
    e.addComponent(new TextRenderer('New Text'));
    this.select(e);
    Inspector.render(e);
    Viewport.drawEditor();
    return e;
  },

  addParticleEntity() {
    const e = this.addEntity('Particles 3D');
    e.addComponent(new ParticleEmitter());
    this.select(e);
    Inspector.render(e);
    Viewport.drawEditor();
    return e;
  },

  deleteSelected() {
    if (!this.selected) return;
    const name = this.selected.name;
    this.scene.entities = this.scene.entities.filter(e => e !== this.selected);
    this.selected = null;
    Inspector.render(null);
    this.refreshHierarchy();
    Viewport.drawEditor();
    this.log(`Deleted: ${name}`, 'warn');
  },

  duplicateSelected() {
    if (!this.selected) return;
    const data = JSON.parse(JSON.stringify(this.selected.serialize()));
    data.name += ' (copy)';
    const copy = Entity.deserialize(data);
    
    Object.entries(data.components || {}).forEach(([type, cdata]) => {
      const Ctor = ComponentRegistry[type];
      if (Ctor) copy.addComponent(Ctor.deserialize ? Ctor.deserialize(cdata) : new Ctor());
    });
    
    copy.transform.position.x += 1;
    copy.transform.position.z += 1;
    this.scene.addEntity(copy);
    this.select(copy);
    this.refreshHierarchy();
    Viewport.drawEditor();
    this.log(`Duplicated: ${copy.name}`, 'success');
  },

  clearScene() {
    if (!confirm('Clear all entities?')) return;
    this.scene.entities = [];
    this.selected = null;
    Inspector.render(null);
    this.refreshHierarchy();
    Viewport.drawEditor();
    this.log('Scene cleared', 'warn');
  },

  select(entity) {
    this.selected = entity;
    Inspector.render(entity);
    this.refreshHierarchy();
    
    // Update script selector
    const sel = document.getElementById('scriptEntitySelect');
    if (sel) {
      sel.innerHTML = '<option value="">— Select entity —</option>' +
        this.scene.entities.map(e => `<option value="${e.id}" ${e===entity?'selected':''}>${e.name}</option>`).join('');
    }
    
    const selInfo = document.getElementById('selectionInfo');
    if (selInfo) selInfo.textContent = entity ? entity.name : '';
    
    document.getElementById('entityCount').textContent = this.scene.entities.length + ' entities';
  },

  refreshHierarchy() {
    const el = document.getElementById('sceneHierarchy');
    const entities = this.scene ? this.scene.entities : [];
    document.getElementById('entityCount').textContent = entities.length + ' entities';
    
    el.innerHTML = entities.map(e => {
      const comps = [...e.components.keys()].map(c => c.replace('Renderer','').replace('Collider','Col')).join(' ');
      const isSelected = e === this.selected;
      return `<div class="hierarchy-item ${isSelected ? 'active' : ''}" onclick="Editor.select(Editor.scene.getEntityById(${e.id}))">
        <span class="hi-icon">◆</span>
        <span>${e.name}</span>
        ${comps ? `<span class="hi-tag">${comps.split(' ').slice(0,2).join(' ')}</span>` : ''}
        <span class="hi-eye" onclick="event.stopPropagation();Editor._toggleVisible(${e.id})" title="Toggle visible">👁</span>
      </div>`;
    }).join('') || '<div style="color:var(--text-dim);font-size:12px;padding:12px;text-align:center">No entities<br><small>Right-click viewport or use<br>Scene menu to add</small></div>';
  },

  _toggleVisible(id) {
    const e = this.scene.getEntityById(id);
    if (e) { 
      e.active = !e.active; 
      this.refreshHierarchy(); 
      Viewport.drawEditor(); 
    }
  },

  // ── Settings ──────────────────────────────────────────────
  setWorldSize() {
    // 3D Scene boundaries or grid size can be managed here if needed
    Viewport.drawEditor();
  },

  updatePhysics() {
    if (this.engine) {
      const gx = parseFloat(document.getElementById('gravityX').value) || 0;
      const gy = parseFloat(document.getElementById('gravityY').value) || -9.81;
      const gz = parseFloat(document.getElementById('gravityZ').value) || 0;
      this.engine.physics.gravity.set(gx, gy, gz);
    }
  },

  updateGlobalLights() {
    const ambColor = document.getElementById('ambientColor').value || '#222233';
    Viewport.ambientLight.color.set(ambColor);
    this.engine.renderer.ambientLight.color.set(ambColor);
  },

  setBgColor(c) { 
    this.scene.backgroundColor = c; 
    Viewport.drawEditor(); 
  },
  
  toggleGrid(v) { 
    Viewport.toggleGrid(v); 
  },
  
  toggleSnap(v) { 
    Viewport.toggleSnap(v); 
  },
  
  setSnapSize(n) { 
    Viewport.setSnapSize(n); 
  },

  zoom(amount) {
    Viewport.zoom(amount);
  },
  
  resetZoom() {
    Viewport.resetZoom();
  },

  setTool(t) {
    Viewport.tool = t;
    ['select','move','scale'].forEach(n => {
      document.getElementById('tool' + n.charAt(0).toUpperCase() + n.slice(1))?.classList.toggle('active', n === t);
    });
    // Set orbit control modes or transform gizmos
    if (t === 'select') {
      Viewport.controls.enabled = true;
    } else {
      Viewport.controls.enabled = false;
    }
  },

  // ── Tabs ──────────────────────────────────────────────────
  switchLeftTab(name, btn) {
    document.querySelectorAll('#panelLeft .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#panelLeft .tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + name)?.classList.add('active');
  },

  switchRightTab(name, btn) {
    document.querySelectorAll('#panelRight .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#panelRight .tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + name)?.classList.add('active');
  },

  switchBottomTab(name, btn) {
    document.querySelectorAll('.panel-bottom .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel-bottom .tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + name)?.classList.add('active');
  },

  // ── Scripting panel ───────────────────────────────────────
  loadEntityScript(id) {
    const e = this.scene.getEntityById(parseInt(id));
    if (!e) return;
    document.getElementById('scriptEditor').value = e.script || '';
    this.select(e);
  },

  saveScript() {
    if (!this.selected) return;
    this.selected.script = document.getElementById('scriptEditor').value;
    delete this.selected._scriptFns;
    delete this.selected._scriptStarted;
    this.log(`Script saved for ${this.selected.name}`, 'success');
    this.engine.audio.beep(640, 0.04, 'sine', 0.1);
  },

  runScript() {
    this.saveScript();
    if (!this.playing) this.play();
  },

  // ── Console ───────────────────────────────────────────────
  log(msg, type = 'info') {
    this._logCount++;
    const now = new Date();
    const time = now.toTimeString().slice(0,8);
    const el = document.getElementById('consoleLog');
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${msg}</span>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    if (this._logCount > 200) el.firstChild?.remove();
  },

  clearConsole() { 
    document.getElementById('consoleLog').innerHTML = ''; 
    this._logCount = 0; 
  },

  // ── Save / Load ───────────────────────────────────────────
  saveScene() {
    const data = JSON.stringify(this.scene.serialize(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.scene.name.replace(/\s+/g,'_') + '.scene.json';
    a.click();
    this.log('Scene saved as JSON', 'success');
  },

  loadScene() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          this.scene = Scene.deserialize(data);
          this.selected = null;
          this.refreshHierarchy();
          Inspector.render(null);
          Viewport.drawEditor();
          this.log(`Scene loaded: ${this.scene.name}`, 'success');
        } catch(err) { this.log('Failed to load scene: ' + err.message, 'error'); }
      };
      reader.readAsText(file);
    };
    inp.click();
  },

  newScene() {
    if (!confirm('Start a new scene? Unsaved changes will be lost.')) return;
    this.scene = new Scene('New Scene');
    this.selected = null;
    this.refreshHierarchy();
    Inspector.render(null);
    Viewport.drawEditor();
    this.log('New scene created', 'info');
  },

  exportJSON() {
    const data = JSON.stringify(this.scene.serialize(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'scene_export_3d.json';
    a.click();
    this.log('3D Scene JSON exported', 'success');
  },

  // ── Modals / Dialogs ──────────────────────────────────────
  showAbout() {
    document.getElementById('modalBackdrop').classList.remove('hidden');
    const m = document.getElementById('modal');
    m.classList.remove('hidden');
    m.innerHTML = `
      <h3>NovaCraft 3D Engine v2.0</h3>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.7">
        A premium browser-based 3D game engine and editor built with Three.js.<br>
        Features hardware-accelerated WebGL rendering, ECS architecture, 3D physics,<br>
        custom script runtime, and positional 3D lighting/particles.<br><br>
        <strong style="color:var(--text)">Controls:</strong> Orbit View (Left Drag), Pan View (Ctrl/Shift + Left Drag or Middle Drag), Zoom (Scroll)<br>
        <strong style="color:var(--text)">Systems:</strong> WebGL Standard Lighting · Shadows · 3D MTV Collisions · Audio Synthesizer
      </p>
      <div class="modal-actions">
        <button class="btn-primary" onclick="Editor.closeModal()">Close</button>
      </div>`;
    document.getElementById('modalBackdrop').onclick = () => this.closeModal();
  },

  showKeybindings() {
    document.getElementById('modalBackdrop').classList.remove('hidden');
    const m = document.getElementById('modal');
    m.classList.remove('hidden');
    m.innerHTML = `
      <h3>Key Bindings</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        ${[
           ['F5','Start / Stop Play Mode'],
           ['Left Drag','Orbit Camera'],
           ['Middle Drag / Scroll','Pan / Zoom viewport'],
           ['Del','Delete Selected Entity'],
           ['Ctrl+D','Duplicate Entity'],
           ['Ctrl+S','Save Scene to file']
          ].map(([k,v]) => `<tr><td style="padding:4px 8px;font-family:var(--mono);color:var(--accent)">${k}</td><td style="color:var(--text-dim)">${v}</td></tr>`).join('')}
      </table>
      <div class="modal-actions">
        <button class="btn-primary" onclick="Editor.closeModal()">Close</button>
      </div>`;
    document.getElementById('modalBackdrop').onclick = () => this.closeModal();
  },

  openSettings() { this.switchRightTab('settings', document.querySelectorAll('#panelRight .tab-btn')[1]); },

  closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modalBackdrop').classList.add('hidden');
  },

  toast(msg, type = 'info', duration = 3000) {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 300); }, duration);
  }
};
