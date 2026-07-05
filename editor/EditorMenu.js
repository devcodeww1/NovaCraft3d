/**
 * NovaCraft 3D Engine — EditorMenu
 * Builds and handles action triggers for editor header dropdown menus.
 */
const EditorMenu = {
  activeMenu: null,
  
  menus: {
    file: [
      { label: 'New Project', action: () => Editor.newScene() },
      { label: 'Save Project (Ctrl+S)', action: () => Editor.saveScene() },
      { label: 'Open Project', action: () => Editor.loadScene() },
      { sep: true },
      { label: 'Export Scene JSON', action: () => Editor.exportJSON() }
    ],
    edit: [
      { label: 'Duplicate Entity (Ctrl+D)', action: () => Editor.duplicateSelected() },
      { label: 'Delete Entity (Del)', action: () => Editor.deleteSelected() },
      { sep: true },
      { label: 'Select All', action: () => Editor.selectAll() }
    ],
    scene: [
      { label: 'Load 3D Demo Scene', action: () => DemoScene.load() },
      { sep: true },
      { label: 'Add Mesh Box', action: () => Editor.addSpriteEntity() },
      { label: 'Add Physics Sphere', action: () => Editor.addPhysicsEntity() },
      { label: 'Add Point Light', action: () => {
        const e = Editor.addEntity('Point Light');
        e.addComponent(new PointLight());
        Viewport.drawEditor();
      }},
      { label: 'Add Directional Light', action: () => {
        const e = Editor.addEntity('Dir Light');
        e.addComponent(new DirectionalLight());
        Viewport.drawEditor();
      }},
      { label: 'Add Camera', action: () => Editor.addCameraEntity() },
      { label: 'Add Particle Emitter', action: () => Editor.addParticleEntity() },
      { label: 'Add 3D Text', action: () => Editor.addTextEntity() }
    ],
    help: [
      { label: 'Key Bindings', action: () => Editor.showKeybindings() },
      { label: 'About NovaCraft 3D', action: () => Editor.showAbout() }
    ]
  },

  open(name) {
    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    const el = document.getElementById('dropdownMenu');
    
    // Clear and build items
    this.activeMenu = name;
    el.innerHTML = this.menus[name].map((item, idx) => {
      if (item.sep) return `<div class="dd-sep"></div>`;
      return `<div class="dd-item" onclick="EditorMenu._run(${idx})">${item.label}</div>`;
    }).join('');

    el.style.left = rect.left + 'px';
    el.style.top = rect.bottom + 'px';
    el.classList.remove('hidden');

    // Close when clicking outside
    setTimeout(() => {
      document.addEventListener('click', () => el.classList.add('hidden'), { once: true });
    }, 10);
  },

  _run(idx, mode = 'menu') {
    const list = mode === 'comp' ? document.getElementById('dropdownMenu')._actions : this.menus[this.activeMenu];
    const item = list ? list[idx] : null;
    if (item && item.action) {
      item.action();
    }
    document.getElementById('dropdownMenu').classList.add('hidden');
  }
};
