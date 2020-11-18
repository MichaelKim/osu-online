// Locks pointer and enables fullscreen
export function lockPointer(app: PIXI.Application) {
  app.view.requestFullscreen();
  app.view.requestPointerLock();
}

// Display out of focus error
export default function initLock(app: PIXI.Application) {
  const pointerLockWarning = document.getElementById('lock');

  pointerLockWarning.addEventListener('click', () => lockPointer(app));

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === app.view;
    console.log('Pointer lock:', locked);
    if (locked) {
      pointerLockWarning.style.display = 'none';
    } else {
      pointerLockWarning.style.display = 'flex';
    }
  });
}
