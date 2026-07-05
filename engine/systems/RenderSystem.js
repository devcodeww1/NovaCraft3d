/**
 * NovaCraft 3D Engine — RenderSystem
 * Integrates WebGL three.js rendering with the Entity-Component System.
 */
class RenderSystem {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.threeScene = new THREE.Scene();
    
    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Append to container
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Default editor/game camera
    this.defaultCamera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    this.defaultCamera.position.set(0, 5, 10);
    this.defaultCamera.lookAt(0, 0, 0);
    this.camera = this.defaultCamera;

    // Global ambient light
    this.ambientLight = new THREE.AmbientLight(0x222233, 1.0);
    this.threeScene.add(this.ambientLight);
    
    // Map to keep track of THREE.Object3D linked to entities
    this.meshMap = new Map();
    
    // Resize handler
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  initScene(scene) {
    this.clearScene();
    this.threeScene.background = new THREE.Color(scene.backgroundColor || '#05050c');
    
    // Create ThreeJS entities
    scene.entities.forEach(entity => this.syncEntity(entity));
  }

  clearScene() {
    // Remove all dynamically added meshes
    this.meshMap.forEach((obj) => {
      this.threeScene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    this.meshMap.clear();
  }

  update(scene, dt, engine) {
    this.threeScene.background.set(scene.backgroundColor || '#05050c');

    let mainCameraComp = null;
    let mainCameraEntity = null;

    // Sync all entity meshes/lights/particles
    scene.entities.forEach(entity => {
      if (!entity.active) {
        const obj = this.meshMap.get(entity.id);
        if (obj) obj.visible = false;
        return;
      }

      this.syncEntity(entity);

      // Track main active camera
      const cam = entity.getComponent('Camera');
      if (cam && cam.enabled && cam.isMain) {
        mainCameraComp = cam;
        mainCameraEntity = entity;
      }
    });

    // Handle Camera setup
    if (mainCameraComp && mainCameraEntity) {
      if (!mainCameraComp._threeCamera) {
        mainCameraComp._threeCamera = new THREE.PerspectiveCamera(mainCameraComp.fov, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
      }
      
      const tCam = mainCameraComp._threeCamera;
      
      // Target to follow
      if (mainCameraComp.followTarget) {
        const target = scene.getEntityByName(mainCameraComp.followTarget);
        if (target) {
          // Camera smoothly lerps to follow target offset
          const dest = new THREE.Vector3().copy(target.transform.position).add(mainCameraComp.followOffset);
          tCam.position.lerp(dest, mainCameraComp.followLerp * dt);
          tCam.lookAt(target.transform.position);
        }
      } else {
        // Just match entity transform
        tCam.position.copy(mainCameraEntity.transform.position);
        tCam.rotation.copy(mainCameraEntity.transform.rotation);
      }
      
      this.camera = tCam;
    } else {
      this.camera = this.defaultCamera;
    }

    // Render WebGL frame
    this.render(scene, dt);
  }

  render(scene, dt) {
    if (this.camera) {
      this.renderer.render(this.threeScene, this.camera);
    }
  }

  syncEntity(entity) {
    let group = this.meshMap.get(entity.id);
    
    if (!group) {
      group = new THREE.Group();
      this.threeScene.add(group);
      this.meshMap.set(entity.id, group);
    }

    group.visible = true;
    
    // Copy main transform
    group.position.copy(entity.transform.position);
    group.rotation.copy(entity.transform.rotation);
    group.scale.copy(entity.transform.scale);

    // 1. MeshRenderer
    const mr = entity.getComponent('MeshRenderer');
    if (mr && mr.enabled) {
      if (!mr._mesh || mr._mesh.userData.type !== mr.type) {
        if (mr._mesh) group.remove(mr._mesh);
        
        // Build Geometry
        let geom;
        if (mr.type === 'sphere') geom = new THREE.SphereGeometry(0.5, 32, 32);
        else if (mr.type === 'cylinder') geom = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        else if (mr.type === 'plane') geom = new THREE.PlaneGeometry(1, 1);
        else if (mr.type === 'cone') geom = new THREE.ConeGeometry(0.5, 1, 32);
        else if (mr.type === 'torus') geom = new THREE.TorusGeometry(0.4, 0.15, 16, 64);
        else geom = new THREE.BoxGeometry(1, 1, 1); // default box
        
        // Material
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
        group.add(mr._mesh);
      }

      // Update mesh properties
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

    // 2. PointLight
    const pl = entity.getComponent('PointLight');
    if (pl && pl.enabled) {
      if (!pl._light) {
        pl._light = new THREE.PointLight(pl.color, pl.intensity, pl.distance, pl.decay);
        pl._light.castShadow = pl.castShadow;
        pl._light.shadow.mapSize.width = 512;
        pl._light.shadow.mapSize.height = 512;
        pl._light.shadow.bias = -0.002;
        group.add(pl._light);
      }
      pl._light.color.set(pl.color);
      pl._light.intensity = pl.intensity;
      pl._light.distance = pl.distance;
      pl._light.decay = pl.decay;
      pl._light.castShadow = pl.castShadow;
    } else if (pl && pl._light) {
      group.remove(pl._light);
      pl._light = null;
    }

    // 3. DirectionalLight
    const dl = entity.getComponent('DirectionalLight');
    if (dl && dl.enabled) {
      if (!dl._light) {
        dl._light = new THREE.DirectionalLight(dl.color, dl.intensity);
        dl._light.castShadow = dl.castShadow;
        dl._light.shadow.mapSize.width = 1024;
        dl._light.shadow.mapSize.height = 1024;
        dl._light.shadow.bias = -0.0005;
        // Position light locally pointing down
        dl._light.position.set(0, 10, 0);
        group.add(dl._light);
      }
      dl._light.color.set(dl.color);
      dl._light.intensity = dl.intensity;
      dl._light.castShadow = dl.castShadow;
    } else if (dl && dl._light) {
      group.remove(dl._light);
      dl._light = null;
    }

    // 4. ParticleEmitter (Simple 3D Particles)
    const pe = entity.getComponent('ParticleEmitter');
    if (pe && pe.enabled) {
      this.updateParticles(pe, group);
    } else if (pe && pe._points) {
      group.remove(pe._points);
      pe._points = null;
    }

    // 5. TextRenderer (3D Billboard Canvas Text)
    const tr = entity.getComponent('TextRenderer');
    if (tr && tr.enabled) {
      this.syncTextSprite(tr, group);
    } else if (tr && tr._sprite) {
      group.remove(tr._sprite);
      tr._sprite = null;
    }
  }

  updateParticles(pe, group) {
    if (!pe.particles.length) {
      if (pe._points) {
        group.remove(pe._points);
        pe._points = null;
      }
      return;
    }

    const posArray = new Float32Array(pe.particles.length * 3);
    pe.particles.forEach((p, idx) => {
      posArray[idx * 3 + 0] = p.position.x - group.position.x;
      posArray[idx * 3 + 1] = p.position.y - group.position.y;
      posArray[idx * 3 + 2] = p.position.z - group.position.z;
    });

    if (!pe._points) {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      
      const mat = new THREE.PointsMaterial({
        color: new THREE.Color(pe.startColor),
        size: pe.startSize,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      pe._points = new THREE.Points(geom, mat);
      group.add(pe._points);
    } else {
      pe._points.geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      pe._points.geometry.attributes.position.needsUpdate = true;
      pe._points.material.size = pe.startSize;
      pe._points.material.color.set(pe.startColor);
    }
  }

  syncTextSprite(tr, group) {
    if (tr._sprite && tr._sprite.userData.text === tr.text && tr._sprite.userData.color === tr.color) {
      return;
    }

    if (tr._sprite) group.remove(tr._sprite);

    // Draw text to offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,256,128);
    ctx.font = `Bold ${tr.fontSize}px Inter, sans-serif`;
    ctx.fillStyle = tr.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tr.text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    tr._sprite = new THREE.Sprite(mat);
    tr._sprite.scale.set(3, 1.5, 1);
    tr._sprite.position.set(0, 1.2, 0); // Position slightly above pivot
    tr._sprite.userData = { text: tr.text, color: tr.color };
    group.add(tr._sprite);
  }
}
