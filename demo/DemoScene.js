const DemoScene = {
  load() {
    if (!Editor.scene) return;
    
    // Clear first
    Editor.scene.entities = [];
    Editor.selected = null;
    
    Editor.scene.name = "WebGL 3D Neon Platformer";
    Editor.scene.backgroundColor = "#040409";
    
    // Set settings UI values
    const bgInput = document.getElementById('bgColor');
    if (bgInput) bgInput.value = "#040409";
    const ambInput = document.getElementById('ambientColor');
    if (ambInput) ambInput.value = "#222233";

    // 1. Directional Light (Sunlight) for shadows
    const sun = Editor.scene.createEntity("Sunlight");
    sun.transform.position.set(5, 15, 5);
    const dl = sun.addComponent(new DirectionalLight());
    dl.intensity = 1.8;
    dl.color = "#ffffff";
    dl.castShadow = true;

    // 2. Starting Platform (Mesh Box)
    const startPlatform = Editor.scene.createEntity("Start Platform");
    startPlatform.transform.position.set(0, 0, 0);
    startPlatform.transform.scale.set(6, 0.5, 6);
    const spMesh = startPlatform.addComponent(new MeshRenderer());
    spMesh.color = "#1f1f3a";
    spMesh.roughness = 0.4;
    spMesh.metalness = 0.2;
    startPlatform.addComponent(new BoxCollider(1, 1, 1));
    const spRb = startPlatform.addComponent(new RigidBody());
    spRb.isStatic = true;

    // 3. Middle Steps
    const step1 = Editor.scene.createEntity("Floating Step 1");
    step1.transform.position.set(0, 1.5, -7);
    step1.transform.scale.set(3, 0.4, 3);
    const s1Mesh = step1.addComponent(new MeshRenderer());
    s1Mesh.color = "#312e81";
    s1Mesh.emissive = "#1e1b4b";
    step1.addComponent(new BoxCollider(1, 1, 1));
    const s1Rb = step1.addComponent(new RigidBody());
    s1Rb.isStatic = true;

    // Add a glowing point light on Step 1
    const light1 = Editor.scene.createEntity("Cyan Glow");
    light1.transform.position.set(0, 2.5, -7);
    const pl1 = light1.addComponent(new PointLight());
    pl1.color = "#06b6d4";
    pl1.intensity = 3.0;
    pl1.distance = 10;

    // Floating step 2
    const step2 = Editor.scene.createEntity("Floating Step 2");
    step2.transform.position.set(4, 2.5, -14);
    step2.transform.scale.set(3, 0.4, 3);
    const s2Mesh = step2.addComponent(new MeshRenderer());
    s2Mesh.color = "#4c1d95";
    s2Mesh.emissive = "#2e1065";
    step2.addComponent(new BoxCollider(1, 1, 1));
    const s2Rb = step2.addComponent(new RigidBody());
    s2Rb.isStatic = true;

    // Add a purple point light on Step 2
    const light2 = Editor.scene.createEntity("Purple Glow");
    light2.transform.position.set(4, 3.5, -14);
    const pl2 = light2.addComponent(new PointLight());
    pl2.color = "#a855f7";
    pl2.intensity = 3.0;
    pl2.distance = 10;

    // 4. Rotating Obstacle (Horizontal Cylinder)
    const obstacle = Editor.scene.createEntity("Spinning Obstacle");
    obstacle.transform.position.set(0, 3.5, -21);
    obstacle.transform.scale.set(6, 0.8, 0.8);
    const obsMesh = obstacle.addComponent(new MeshRenderer());
    obsMesh.type = "cylinder";
    obsMesh.color = "#b91c1c";
    obsMesh.emissive = "#450a0a";
    obstacle.addComponent(new BoxCollider(1, 1, 1));
    const obsRb = obstacle.addComponent(new RigidBody());
    obsRb.isStatic = true;
    obstacle.script = `
// Spin obstacle script
let spinSpeed = 2.0;
function onUpdate(dt) {
  this.entity.transform.rotation.y += spinSpeed * dt;
}
`;

    // 5. Goal Platform
    const goalPlatform = Editor.scene.createEntity("Goal Platform");
    goalPlatform.transform.position.set(0, 3.0, -28);
    goalPlatform.transform.scale.set(6, 0.5, 6);
    const gpMesh = goalPlatform.addComponent(new MeshRenderer());
    gpMesh.color = "#064e3b";
    gpMesh.roughness = 0.2;
    gpMesh.metalness = 0.8;
    goalPlatform.addComponent(new BoxCollider(1, 1, 1));
    const gpRb = goalPlatform.addComponent(new RigidBody());
    gpRb.isStatic = true;

    // Goal Portal Trigger (Glowing Torus)
    const portal = Editor.scene.createEntity("Goal Portal");
    portal.transform.position.set(0, 4.5, -28);
    portal.transform.scale.set(2, 2, 2);
    const portalMesh = portal.addComponent(new MeshRenderer());
    portalMesh.type = "torus";
    portalMesh.color = "#34d399";
    portalMesh.emissive = "#064e3b";
    const portalCol = portal.addComponent(new CircleCollider(0.6));
    portalCol.isTrigger = true;
    
    // Portal script
    portal.script = `
let time = 0;
function onUpdate(dt) {
  time += dt;
  // Spin and bob up and down
  this.entity.transform.rotation.y += 1.5 * dt;
  this.entity.transform.position.y = 4.5 + Math.sin(time * 3) * 0.15;
}

function onStart() {
  this.entity.on('trigger', (other) => {
    if (other.name === 'Player') {
      audio.beep(600, 0.1, 'sine', 0.2);
      audio.beep(800, 0.1, 'sine', 0.2);
      audio.beep(1000, 0.2, 'sine', 0.3);
      
      // Burst celebration particles!
      const particles = scene.getEntityByName("Win Particles");
      if (particles) {
        const pe = particles.getComponent("ParticleEmitter");
        if (pe) pe.burst(50);
      }
      
      // Reset player position after short delay
      setTimeout(() => {
        other.transform.position.set(0, 1, 0);
        const rb = other.getComponent("RigidBody");
        if (rb) rb.velocity.set(0, 0, 0);
      }, 1000);
    }
  });
}
`;

    // Particles for portal celebration
    const winParticles = Editor.scene.createEntity("Win Particles");
    winParticles.transform.position.set(0, 4.5, -28);
    const wPe = winParticles.addComponent(new ParticleEmitter());
    wPe.emitting = false;
    wPe.startColor = "#34d399";
    wPe.endColor = "#60a5fa";
    wPe.speed = 6.0;

    // 6. Danger Void (Trigger Box)
    const voidTrigger = Editor.scene.createEntity("Void Fall");
    voidTrigger.transform.position.set(0, -5, -15);
    voidTrigger.transform.scale.set(60, 1, 60);
    const voidCol = voidTrigger.addComponent(new BoxCollider(1, 1, 1));
    voidCol.isTrigger = true;
    voidTrigger.script = `
function onStart() {
  this.entity.on('trigger', (other) => {
    if (other.name === 'Player') {
      // Play fail sound
      audio.beep(150, 0.3, 'sawtooth', 0.3);
      
      // Respawn Player
      other.transform.position.set(0, 2, 0);
      const rb = other.getComponent('RigidBody');
      if (rb) {
        rb.velocity.set(0, 0, 0);
        rb.isGrounded = false;
      }
    }
  });
}
`;

    // 7. Player (3D Sphere)
    const player = Editor.scene.createEntity("Player");
    player.transform.position.set(0, 2, 0);
    const playerMesh = player.addComponent(new MeshRenderer());
    playerMesh.type = "sphere";
    playerMesh.color = "#a78bfa";
    playerMesh.roughness = 0.1;
    playerMesh.metalness = 0.9;
    player.addComponent(new CircleCollider(0.5));
    const pRb = player.addComponent(new RigidBody());
    pRb.mass = 1.0;
    pRb.bounciness = 0.05;
    pRb.friction = 0.3;
    
    // Player Script controls WASD / Space
    player.script = `
const speed = 10;
const jumpForce = 6.5;

function onUpdate(dt) {
  const rb = this.entity.getComponent('RigidBody');
  if (!rb) return;

  // Read WASD keyboard inputs
  let moveX = 0;
  let moveZ = 0;
  
  if (input.isDown('KeyA') || input.isDown('ArrowLeft') || input.isDown('a')) {
    moveX = -1;
  } else if (input.isDown('KeyD') || input.isDown('ArrowRight') || input.isDown('d')) {
    moveX = 1;
  }
  
  if (input.isDown('KeyW') || input.isDown('ArrowUp') || input.isDown('w')) {
    moveZ = -1;
  } else if (input.isDown('KeyS') || input.isDown('ArrowDown') || input.isDown('s')) {
    moveZ = 1;
  }

  // Set horizontal/depth velocities
  rb.velocity.x = moveX * speed;
  rb.velocity.z = moveZ * speed;

  // Jump logic
  // Check if player is near ground (using vertical velocity threshold)
  const isGrounded = Math.abs(rb.velocity.y) < 0.1;

  if ((input.isPressed('Space') || input.isPressed('KeyW') || input.isPressed('ArrowUp')) && isGrounded) {
    rb.velocity.y = jumpForce;
    audio.beep(400, 0.05, 'triangle', 0.2);
  }
}
`;

    // 8. Main Perspective Camera
    const camera = Editor.scene.createEntity("Main Camera");
    const camComp = camera.addComponent(new Camera());
    camComp.followTarget = "Player";
    camComp.followOffset.set(0, 5, 8); // Look from above & behind
    camComp.followLerp = 4.0;
    camComp.isMain = true;

    // Refresh hierarchy list & selection
    Editor.select(player);
    Editor.refreshHierarchy();
    Viewport.drawEditor();
    
    Editor.log("Stunning WebGL 3D demo scene loaded!", "success");
    Editor.log("Press F5 (Play) to start. Controls: WASD + Space.", "info");
    Editor.toast("3D Demo Scene Loaded!", "success");
  }
};
