/**
 * NovaCraft Engine — boot.js
 * Handles engine initialization, splash screen, and boot.
 */
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const splashBar = document.getElementById('splashBar');
  const splashStatus = document.getElementById('splashStatus');
  const app = document.getElementById('app');

  const steps = [
    { progress: 10, status: "Loading core engine assemblies..." },
    { progress: 30, status: "Initializing ECS database & registry..." },
    { progress: 50, status: "Loading Web Audio & Sound buffers..." },
    { progress: 70, status: "Configuring WebGL / 2D Canvas viewport..." },
    { progress: 90, status: "Assembling Editor UI Panels..." },
    { progress: 100, status: "Done!" }
  ];

  let currentStep = 0;

  function nextStep() {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      splashBar.style.width = `${step.progress}%`;
      splashStatus.textContent = step.status;
      currentStep++;
      setTimeout(nextStep, 150 + Math.random() * 200);
    } else {
      // Fade out splash screen
      splash.style.transition = 'opacity 0.4s ease';
      splash.style.opacity = '0';
      
      setTimeout(() => {
        splash.classList.add('hidden');
        app.classList.remove('hidden');
        
        // Boot Editor
        Editor.init();
        
        // Auto-load demo scene
        DemoScene.load();
        
        // Adjust panel resize listeners (stub for manual adjustments)
        setupPanelResizers();
      }, 400);
    }
  }

  // Trigger boot sequence
  setTimeout(nextStep, 200);
});

// Panel Resizer Handling
function setupPanelResizers() {
  const resizeLeft = document.getElementById('resizeLeft');
  const resizeRight = document.getElementById('resizeRight');
  const resizeBottom = document.getElementById('resizeBottom');
  
  const panelLeft = document.getElementById('panelLeft');
  const panelRight = document.getElementById('panelRight');
  const panelBottom = document.getElementById('panelBottom');
  const viewportArea = document.querySelector('.viewport-area');
  const app = document.getElementById('app');

  let isResizingLeft = false;
  let isResizingRight = false;
  let isResizingBottom = false;

  resizeLeft.addEventListener('mousedown', (e) => {
    isResizingLeft = true;
    document.body.style.cursor = 'col-resize';
  });

  resizeRight.addEventListener('mousedown', (e) => {
    isResizingRight = true;
    document.body.style.cursor = 'col-resize';
  });

  resizeBottom.addEventListener('mousedown', (e) => {
    isResizingBottom = true;
    document.body.style.cursor = 'row-resize';
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizingLeft) {
      const newWidth = Math.max(150, Math.min(400, e.clientX));
      panelLeft.style.width = `${newWidth}px`;
      resizeLeft.style.left = `${newWidth}px`;
      updateGridColumns();
      Viewport.resize();
    } else if (isResizingRight) {
      const newWidth = Math.max(180, Math.min(500, window.innerWidth - e.clientX));
      panelRight.style.width = `${newWidth}px`;
      resizeRight.style.right = `${newWidth}px`;
      updateGridColumns();
      Viewport.resize();
    } else if (isResizingBottom) {
      const newHeight = Math.max(100, Math.min(400, window.innerHeight - e.clientY));
      panelBottom.style.height = `${newHeight}px`;
      resizeBottom.style.bottom = `${newHeight}px`;
      updateGridRows();
      Viewport.resize();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizingLeft || isResizingRight || isResizingBottom) {
      isResizingLeft = false;
      isResizingRight = false;
      isResizingBottom = false;
      document.body.style.cursor = 'default';
    }
  });

  function updateGridColumns() {
    const leftW = panelLeft.offsetWidth;
    const rightW = panelRight.offsetWidth;
    app.style.gridTemplateColumns = `1fr`;
    // We adjust via css or inline style of workspace grid
    const workspace = document.querySelector('.workspace');
    workspace.style.gridTemplateColumns = `${leftW}px 1fr ${rightW}px`;
  }

  function updateGridRows() {
    const bottomH = panelBottom.offsetHeight;
    app.style.gridTemplateRows = `42px 1fr ${bottomH}px`;
  }
}
