const Inspector = {
  render(entity) {
    const el = document.getElementById('inspector');
    if (!entity) {
      el.innerHTML = `<div class="inspector-empty">
        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" opacity="0.3"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        <p>Select an entity to inspect</p></div>`;
      return;
    }

    const t = entity.transform;
    let html = `
      <div class="inspector-header">
        <input class="inspector-name-input" id="eName" value="${entity.name}" onchange="Inspector.setName(this.value)"/>
        <input type="checkbox" class="active-toggle" ${entity.active ? 'checked' : ''} onchange="Inspector.setActive(this.checked)" title="Active"/>
      </div>

      <div class="inspector-section">
        <div class="section-header" onclick="Inspector.toggleSection(this)">
          📐 Transform 3D <span class="section-arrow">▼</span>
        </div>
        <div class="section-body">
          <div class="prop-row"><span class="prop-label">Position</span>
            <div class="vec2-group">
              <input class="prop-input" type="number" step="0.5" value="${t.position.x.toFixed(2)}" onchange="Inspector.setProp('px',+this.value)" placeholder="X"/>
              <input class="prop-input" type="number" step="0.5" value="${t.position.y.toFixed(2)}" onchange="Inspector.setProp('py',+this.value)" placeholder="Y"/>
              <input class="prop-input" type="number" step="0.5" value="${t.position.z.toFixed(2)}" onchange="Inspector.setProp('pz',+this.value)" placeholder="Z"/>
            </div>
          </div>
          <div class="prop-row"><span class="prop-label">Rotation</span>
            <div class="vec2-group">
              <input class="prop-input" type="number" step="5" value="${Math.round(t.rotation.x * 180/Math.PI)}" onchange="Inspector.setProp('rx',+this.value)" placeholder="Pitch X"/>
              <input class="prop-input" type="number" step="5" value="${Math.round(t.rotation.y * 180/Math.PI)}" onchange="Inspector.setProp('ry',+this.value)" placeholder="Yaw Y"/>
              <input class="prop-input" type="number" step="5" value="${Math.round(t.rotation.z * 180/Math.PI)}" onchange="Inspector.setProp('rz',+this.value)" placeholder="Roll Z"/>
            </div>
          </div>
          <div class="prop-row"><span class="prop-label">Scale</span>
            <div class="vec2-group">
              <input class="prop-input" type="number" step="0.1" value="${t.scale.x.toFixed(2)}" onchange="Inspector.setProp('sx',+this.value)" placeholder="X"/>
              <input class="prop-input" type="number" step="0.1" value="${t.scale.y.toFixed(2)}" onchange="Inspector.setProp('sy',+this.value)" placeholder="Y"/>
              <input class="prop-input" type="number" step="0.1" value="${t.scale.z.toFixed(2)}" onchange="Inspector.setProp('sz',+this.value)" placeholder="Z"/>
            </div>
          </div>
          <div class="prop-row"><span class="prop-label">Layer</span>
            <input class="prop-input" type="number" value="${entity.layer}" onchange="Inspector.setProp('layer',+this.value)"/>
          </div>
          <div class="prop-row"><span class="prop-label">Tag</span>
            <input class="prop-input" value="${entity.tag}" onchange="Inspector.setProp('tag',this.value)"/>
          </div>
        </div>
      </div>`;

    // Render each component
    entity.components.forEach((comp, type) => {
      html += Inspector.renderComponent(type, comp);
    });

    html += `<button class="add-component-btn" onclick="Inspector.addComponentMenu()">+ Add Component</button>`;
    el.innerHTML = html;
  },

  renderComponent(type, comp) {
    const sections = {
      RigidBody: () => `
        <div class="prop-row"><span class="prop-label">Mass</span><input class="prop-input" type="number" step="0.1" value="${comp.mass}" onchange="Inspector.setComp('${type}','mass',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Use Gravity</span><input type="checkbox" class="prop-check" ${comp.useGravity?'checked':''} onchange="Inspector.setComp('${type}','useGravity',this.checked)"/></div>
        <div class="prop-row"><span class="prop-label">Gravity Scale</span><input class="prop-input" type="number" step="0.1" value="${comp.gravityScale}" onchange="Inspector.setComp('${type}','gravityScale',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Is Static</span><input type="checkbox" class="prop-check" ${comp.isStatic?'checked':''} onchange="Inspector.setComp('${type}','isStatic',this.checked)"/></div>
        <div class="prop-row"><span class="prop-label">Bounce</span><input class="prop-input" type="number" step="0.05" min="0" max="1" value="${comp.bounciness}" onchange="Inspector.setComp('${type}','bounciness',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Friction</span><input class="prop-input" type="number" step="0.05" min="0" max="1" value="${comp.friction}" onchange="Inspector.setComp('${type}','friction',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Drag</span><input class="prop-input" type="number" step="0.01" value="${comp.drag}" onchange="Inspector.setComp('${type}','drag',+this.value)"/></div>`,

      BoxCollider: () => `
        <div class="prop-row"><span class="prop-label">Width</span><input class="prop-input" type="number" step="0.5" value="${comp.width}" onchange="Inspector.setComp('${type}','width',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Height</span><input class="prop-input" type="number" step="0.5" value="${comp.height}" onchange="Inspector.setComp('${type}','height',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Depth</span><input class="prop-input" type="number" step="0.5" value="${comp.depth}" onchange="Inspector.setComp('${type}','depth',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Offset X</span><input class="prop-input" type="number" value="${comp.offsetX}" onchange="Inspector.setComp('${type}','offsetX',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Offset Y</span><input class="prop-input" type="number" value="${comp.offsetY}" onchange="Inspector.setComp('${type}','offsetY',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Offset Z</span><input class="prop-input" type="number" value="${comp.offsetZ}" onchange="Inspector.setComp('${type}','offsetZ',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Is Trigger</span><input type="checkbox" class="prop-check" ${comp.isTrigger?'checked':''} onchange="Inspector.setComp('${type}','isTrigger',this.checked)"/></div>`,

      CircleCollider: () => `
        <div class="prop-row"><span class="prop-label">Radius</span><input class="prop-input" type="number" step="0.1" value="${comp.radius}" onchange="Inspector.setComp('${type}','radius',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Is Trigger</span><input type="checkbox" class="prop-check" ${comp.isTrigger?'checked':''} onchange="Inspector.setComp('${type}','isTrigger',this.checked)"/></div>`,

      MeshRenderer: () => `
        <div class="prop-row"><span class="prop-label">Geometry</span>
          <select class="prop-select" onchange="Inspector.setComp('${type}','type',this.value)">
            ${['box','sphere','cylinder','plane','cone','torus'].map(g => `<option ${comp.type===g?'selected':''}>${g}</option>`).join('')}
          </select></div>
        <div class="prop-row"><span class="prop-label">Color</span><input type="color" class="prop-color" value="${comp.color||'#a78bfa'}" onchange="Inspector.setComp('${type}','color',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Roughness</span><input class="prop-input" type="number" step="0.1" min="0" max="1" value="${comp.roughness}" onchange="Inspector.setComp('${type}','roughness',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Metalness</span><input class="prop-input" type="number" step="0.1" min="0" max="1" value="${comp.metalness}" onchange="Inspector.setComp('${type}','metalness',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Opacity</span><input class="prop-input" type="number" step="0.1" min="0" max="1" value="${comp.opacity}" onchange="Inspector.setComp('${type}','opacity',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Emissive</span><input type="color" class="prop-color" value="${comp.emissive||'#000000'}" onchange="Inspector.setComp('${type}','emissive',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Shadows</span>
          <div class="vec2-group" style="align-items:center">
            <span style="font-size:10px;color:var(--text-dim)">Cast</span>
            <input type="checkbox" class="prop-check" ${comp.castShadow?'checked':''} onchange="Inspector.setComp('${type}','castShadow',this.checked)"/>
            <span style="font-size:10px;color:var(--text-dim)">Recv</span>
            <input type="checkbox" class="prop-check" ${comp.receiveShadow?'checked':''} onchange="Inspector.setComp('${type}','receiveShadow',this.checked)"/>
          </div>
        </div>`,

      Camera: () => `
        <div class="prop-row"><span class="prop-label">FOV</span><input class="prop-input" type="number" step="5" value="${comp.fov}" onchange="Inspector.setComp('${type}','fov',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Follow</span><input class="prop-input" value="${comp.followTarget||''}" onchange="Inspector.setComp('${type}','followTarget',this.value)" placeholder="Entity name"/></div>
        <div class="prop-row"><span class="prop-label">Offset</span>
          <div class="vec2-group">
            <input class="prop-input" type="number" value="${comp.followOffset.x}" onchange="Inspector.setOffset(0,+this.value)"/>
            <input class="prop-input" type="number" value="${comp.followOffset.y}" onchange="Inspector.setOffset(1,+this.value)"/>
            <input class="prop-input" type="number" value="${comp.followOffset.z}" onchange="Inspector.setOffset(2,+this.value)"/>
          </div>
        </div>
        <div class="prop-row"><span class="prop-label">Lerp Speed</span><input class="prop-input" type="number" step="0.5" value="${comp.followLerp}" onchange="Inspector.setComp('${type}','followLerp',+this.value)"/></div>`,

      PointLight: () => `
        <div class="prop-row"><span class="prop-label">Color</span><input type="color" class="prop-color" value="${comp.color||'#ffffff'}" onchange="Inspector.setComp('${type}','color',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Intensity</span><input class="prop-input" type="number" step="0.5" value="${comp.intensity}" onchange="Inspector.setComp('${type}','intensity',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Distance</span><input class="prop-input" type="number" value="${comp.distance}" onchange="Inspector.setComp('${type}','distance',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Decay</span><input class="prop-input" type="number" step="0.1" value="${comp.decay}" onchange="Inspector.setComp('${type}','decay',+this.value)"/></div>`,

      DirectionalLight: () => `
        <div class="prop-row"><span class="prop-label">Color</span><input type="color" class="prop-color" value="${comp.color||'#ffffff'}" onchange="Inspector.setComp('${type}','color',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Intensity</span><input class="prop-input" type="number" step="0.2" value="${comp.intensity}" onchange="Inspector.setComp('${type}','intensity',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Shadows</span><input type="checkbox" class="prop-check" ${comp.castShadow?'checked':''} onchange="Inspector.setComp('${type}','castShadow',this.checked)"/></div>`,

      ParticleEmitter: () => `
        <div class="prop-row"><span class="prop-label">Rate</span><input class="prop-input" type="number" value="${comp.rate}" onchange="Inspector.setComp('${type}','rate',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Lifetime</span><input class="prop-input" type="number" step="0.1" value="${comp.lifetime}" onchange="Inspector.setComp('${type}','lifetime',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Speed</span><input class="prop-input" type="number" step="0.5" value="${comp.speed}" onchange="Inspector.setComp('${type}','speed',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Start Size</span><input class="prop-input" type="number" step="0.05" value="${comp.startSize}" onchange="Inspector.setComp('${type}','startSize',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Start Color</span><input type="color" class="prop-color" value="${comp.startColor||'#38bdf8'}" onchange="Inspector.setComp('${type}','startColor',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">End Color</span><input type="color" class="prop-color" value="${comp.endColor||'#a78bfa'}" onchange="Inspector.setComp('${type}','endColor',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Emitting</span><input type="checkbox" class="prop-check" ${comp.emitting?'checked':''} onchange="Inspector.setComp('${type}','emitting',this.checked)"/></div>
        <div class="prop-row"><span class="prop-label"></span><button class="prop-btn" onclick="Inspector.burst('${type}')">Burst Particles</button></div>`,

      TextRenderer: () => `
        <div class="prop-row"><span class="prop-label">Text</span><input class="prop-input" value="${comp.text}" onchange="Inspector.setComp('${type}','text',this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Size</span><input class="prop-input" type="number" value="${comp.fontSize}" onchange="Inspector.setComp('${type}','fontSize',+this.value)"/></div>
        <div class="prop-row"><span class="prop-label">Color</span><input type="color" class="prop-color" value="${comp.color||'#ffffff'}" onchange="Inspector.setComp('${type}','color',this.value)"/></div>`
    };

    const icons = { RigidBody:'⚙️', BoxCollider:'📦', CircleCollider:'⭕', MeshRenderer:'🔷', Sprite:'🖼️', ShapeRenderer:'🔷', Camera:'📷', PointLight:'💡', DirectionalLight:'☀️', ParticleEmitter:'✨', TextRenderer:'✏️', Animator:'🎞️', Tilemap:'🗺️' };
    const bodyFn = sections[type];
    return `
      <div class="inspector-section">
        <div class="section-header" onclick="Inspector.toggleSection(this)">
          ${icons[type]||'🔧'} ${type}
          <span class="section-arrow" style="margin-left:auto">▼</span>
          <span onclick="event.stopPropagation();Inspector.removeComp('${type}')" style="color:var(--danger);margin-left:8px;font-size:10px;cursor:pointer">✕</span>
        </div>
        <div class="section-body">${bodyFn ? bodyFn() : '<div style="color:var(--text-dim);font-size:11px">No editable properties</div>'}</div>
      </div>`;
  },

  toggleSection(header) {
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    if (body) body.style.display = header.classList.contains('collapsed') ? 'none' : '';
  },

  setName(v) { if (Editor.selected) { Editor.selected.name = v; Editor.refreshHierarchy(); } },
  setActive(v) { if (Editor.selected) { Editor.selected.active = v; } },

  setProp(key, val) {
    const e = Editor.selected; if (!e) return;
    const t = e.transform;
    if (key === 'px')    t.position.x = val;
    if (key === 'py')    t.position.y = val;
    if (key === 'pz')    t.position.z = val;
    if (key === 'rx')    t.rotation.x = val * Math.PI / 180;
    if (key === 'ry')    t.rotation.y = val * Math.PI / 180;
    if (key === 'rz')    t.rotation.z = val * Math.PI / 180;
    if (key === 'sx')    t.scale.x    = val;
    if (key === 'sy')    t.scale.y    = val;
    if (key === 'sz')    t.scale.z    = val;
    if (key === 'layer') e.layer      = val;
    if (key === 'tag')   e.tag        = val;
    Viewport.drawEditor();
  },

  setComp(type, key, val) {
    const e = Editor.selected; if (!e) return;
    const c = e.getComponent(type);
    if (c) {
      c[key] = val;
      Viewport.drawEditor();
    }
  },

  setOffset(axis, val) {
    const e = Editor.selected; if (!e) return;
    const c = e.getComponent('Camera');
    if (c) {
      if (axis === 0) c.followOffset.x = val;
      if (axis === 1) c.followOffset.y = val;
      if (axis === 2) c.followOffset.z = val;
    }
  },

  removeComp(type) {
    const e = Editor.selected; if (!e) return;
    e.removeComponent(type);
    Inspector.render(e);
  },

  burst(type) {
    const e = Editor.selected; if (!e) return;
    const c = e.getComponent(type);
    if (c && c.burst) c.burst(25);
  },

  addComponentMenu() {
    const types = ['RigidBody', 'BoxCollider', 'CircleCollider', 'MeshRenderer', 'Camera', 'PointLight', 'DirectionalLight', 'ParticleEmitter', 'TextRenderer'];
    const items = types.map(t => ({
      label: t, sep: false,
      action: () => {
        const e = Editor.selected; if (!e) return;
        if (!e.hasComponent(t)) {
          e.addComponent(new ComponentRegistry[t]());
          Inspector.render(e);
          Viewport.drawEditor();
          Editor.log(`Added ${t} to ${e.name}`, 'success');
        } else {
          Editor.log(`${e.name} already has ${t}`, 'warn');
        }
      }
    }));

    const menu = document.getElementById('dropdownMenu');
    menu._actions = items;
    menu.innerHTML = items.map((it, i) =>
      `<div class="dd-item" onclick="EditorMenu._run(${i},'comp')">${it.label}</div>`
    ).join('');
    const btn = document.querySelector('.add-component-btn');
    const rect = btn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top  = rect.top - items.length * 30 + 'px';
    menu.classList.remove('hidden');
    setTimeout(() => {
      document.addEventListener('click', () => menu.classList.add('hidden'), { once: true });
    }, 10);
  }
};
