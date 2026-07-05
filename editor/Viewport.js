/**
 * NovaCraft 3D Engine — Viewport
 * 3D Editor Viewport utilizing Three.js and OrbitControls.
 */
const Viewport = {
  container: null,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  gridHelper: null,
  axesHelper: null,
  
  // Selection / Tool state
  tool: 'select',
  raycaster: new THREE.Raycaster(),
  mouse: new THREE.Vector2(),
  meshMap: new Map(), // Maps entity.id -> THREE.Group

  init(containerId) {
    this.container = document.getElementById(containerId);
    
    // Create Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Create Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#05050c');

    // Create Camera
    this.camera = new THREE.PerspectiveCamera(
      60, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 10, 15);

    // Create Controls (OrbitControls)
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;

    // Helpers
    this.gridHelper = new THREE.GridHelper(40, 40, 0x4f46e5, 0x1e1e35);
    this.scene.add(this.gridHelper);

    this.axesHelper = new THREE.AxesHelper(5);
    this.scene.add(this.axesHelper);

    // Default Editor Lights
    const ambientLight = new THREE.AmbientLight(0x333344, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // Listeners
    this._bindEvents();
    
    // Start drawing loop for the editor
    this._loop();
  },

  _bindEvents() {
    window.addEventListener('resize', () => this.resize());
    
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (e.button === 0) { // Left click
        // Raycast select
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Find intersections in all groups
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        // Filter intersections that map to entities
        let foundEntity = null;
        for (const hit of intersects) {
          let current = hit.object;
          while (current) {
            if (current.userData && current.userData.entityId) {
              foundEntity = Editor.scene.getEntityById(current.userData.entityId);
              break;
            }
            current = current.parent;
          }
          if (foundEntity) break;
        }
        
        if (foundEntity) {
          Editor.select(foundEntity);
        } else {
          // If we click empty space and not using OrbitControls pan/zoom
          // Editor.select(null);
        }
      }
    });
  },

  resize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  drawEditor() {
    if (!Editor.scene) return;
    
    this.scene.background.set(Editor.scene.backgroundColor || '#05050c');
    
    // Keep track of active entity IDs
    const activeIds = new Set(Editor.scene.entities.map(e => e.id));
    
    // Remove deleted entities
    this.meshMap.forEach((group, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(group);
        // dispose geometries/materials
        group.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) child.material.dispose();
        });
        this.meshMap.delete(id);
      }
    });

    // Draw/Sync existing entities
    Editor.scene.entities.forEach(entity => {
      if (!entity.active) {
        const g = this.meshMap.get(entity.id);
        if (g) g.visible = false;
        return;
      }
      this.syncEntity(entity);
    });

    // Update selection helpers (visual overlay)
    this.meshMap.forEach((group, id) => {
      const isSelected = Editor.selected && Editor.selected.id === id;
      const wire = group.getObjectByName('selectionBox');
      if (isSelected) {
        if (!wire) {
          const helper = new THREE.BoxHelper(group.children[0], 0xa78bfa);
          helper.name = 'selectionBox';
          group.add(helper);
        } else {
          wire.update();
        }
      } else {
        if (wire) group.remove(wire);
      }
    });
  },

  syncEntity(entity) {
    let group = this.meshMap.get(entity.id);
    if (!group) {
      group = new THREE.Group();
      group.userData.entityId = entity.id;
      this.scene.add(group);
      this.meshMap.set(entity.id, group);
    }
    
    group.visible = true;

    // Apply transform properties
    group.position.copy(entity.transform.position);
    group.rotation.copy(entity.transform.rotation);
    group.scale.copy(entity.transform.scale);

    // Sync MeshRenderer
    const mr = entity.getComponent('MeshRenderer');
    if (mr && mr.enabled) {
      if (!mr._mesh || mr._mesh.userData.type !== mr.type) {
        if (mr._mesh) group.remove(mr._mesh);
        
        let geom;
        if (mr.type === 'sphere') geom = new THREE.SphereGeometry(0.5, 24, 24);
        else if (mr.type === 'cylinder') geom = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
        else if (mr.type === 'plane') geom = new THREE.PlaneGeometry(1, 1);
        else if (mr.type === 'cone') geom = new THREE.ConeGeometry(0.5, 1, 16);
        else if (mr.type === 'torus') geom = new THREE.TorusGeometry(0.4, 0.12, 12, 48);
        else geom = new THREE.BoxGeometry(1, 1, 1);

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(mr.color),
          roughness: mr.roughness,
          metalness: mr.metalness,
          transparent: mr.opacity < 1.0,
          opacity: mr.opacity
        });
        
        if (mr.emissive && mr.emissive !== '#000000') {
          mat.emissive.set(mr.emissive);
          mat.emissiveIntensity = 1.0;
        }

        mr._mesh = new THREE.Mesh(geom, mat);
        mr._mesh.userData.type = mr.type;
        mr._mesh.userData.entityId = entity.id;
        group.add(mr._mesh);
      }
      
      // Update properties
      mr._mesh.castShadow = mr.castShadow;
      mr._mesh.receiveShadow = mr.receiveShadow;
      mr._mesh.material.color.set(mr.color);
      mr._mesh.material.roughness = mr.roughness;
      mr._mesh.material.metalness = mr.metalness;
      mr._mesh.material.opacity = mr.opacity;
      mr._mesh.material.transparent = mr.opacity < 1.0;
      if (mr.emissive && mr.emissive !== '#000000') {
        mr._mesh.material.emissive.set(mr.emissive);
      } else {
        mr._mesh.material.emissive.set(0x000000);
      }
    } else {
      if (mr && mr._mesh) {
        group.remove(mr._mesh);
        mr._mesh = null;
      }
    }

    // Sync PointLight
    const pl = entity.getComponent('PointLight');
    if (pl && pl.enabled) {
      if (!pl._light) {
        pl._light = new THREE.PointLight(pl.color, pl.intensity, pl.distance, pl.decay);
        pl._light.userData.entityId = entity.id;
        group.add(pl._light);
        
        // Add a small bulb visual representation in editor
        const bulbGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const bulbMat = new THREE.MeshBasicMaterial({ color: pl.color });
        const bulb = new THREE.Mesh(bulbGeom, bulbMat);
        bulb.name = 'bulbVisual';
        group.add(bulb);
      }
      pl._light.color.set(pl.color);
      pl._light.intensity = pl.intensity;
      pl._light.distance = pl.distance;
      const bulb = group.getObjectByName('bulbVisual');
      if (bulb) bulb.material.color.set(pl.color);
    } else {
      if (pl && pl._light) {
        group.remove(pl._light);
        pl._light = null;
        const bulb = group.getObjectByName('bulbVisual');
        if (bulb) group.remove(bulb);
      }
    }

    // Sync DirectionalLight
    const dl = entity.getComponent('DirectionalLight');
    if (dl && dl.enabled) {
      if (!dl._light) {
        dl._light = new THREE.DirectionalLight(dl.color, dl.intensity);
        dl._light.position.set(0, 5, 0);
        group.add(dl._light);
        
        // Add a helper arrow visual
        const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1.5, 0), 1.5, dl.color);
        arrow.name = 'arrowVisual';
        group.add(arrow);
      }
      dl._light.color.set(dl.color);
      dl._light.intensity = dl.intensity;
      const arrow = group.getObjectByName('arrowVisual');
      if (arrow) arrow.setColor(new THREE.Color(dl.color));
    } else {
      if (dl && dl._light) {
        group.remove(dl._light);
        dl._light = null;
        const arrow = group.getObjectByName('arrowVisual');
        if (arrow) group.remove(arrow);
      }
    }

    // Camera Visual (Editor helper)
    const cam = entity.getComponent('Camera');
    if (cam && cam.enabled) {
      let camVis = group.getObjectByName('camVisual');
      if (!camVis) {
        const camGeom = new THREE.ConeGeometry(0.25, 0.6, 4);
        camGeom.rotateX(Math.PI/2);
        const camMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
        camVis = new THREE.Mesh(camGeom, camMat);
        camVis.name = 'camVisual';
        group.add(camVis);
      }
    } else {
      const camVis = group.getObjectByName('camVisual');
      if (camVis) group.remove(camVis);
    }
  },

  _loop() {
    requestAnimationFrame(() => this._loop());
    
    if (Editor.playing) return; // Don't render editor scene while playing
    
    // Update OrbitControls
    if (this.controls) this.controls.update();

    this.drawEditor();

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  },

  zoom(amount) {
    if (!this.camera) return;
    this.camera.position.z = Math.max(2, this.camera.position.z + amount);
  },

  resetZoom() {
    if (!this.camera || !this.controls) return;
    this.camera.position.set(0, 10, 15);
    this.controls.target.set(0, 0, 0);
  },

  toggleGrid(visible) {
    this.showGrid = visible;
    if (this.gridHelper) this.gridHelper.visible = visible;
  },

  toggleSnap(visible) {
    this.snapEnabled = visible;
  },

  setSnapSize(size) {
    this.snapSize = size;
  }
};
