// Locks pointer and enables fullscreen
export function lockPointer(view: HTMLCanvasElement) {
  document.documentElement.requestFullscreen().then(() => {
    view.requestPointerLock();
  });
}

// Display out of focus error
export default function initLock(view: HTMLCanvasElement) {
  const pointerLockWarning = document.getElementById('lock');

  pointerLockWarning.addEventListener('click', () => lockPointer(view));

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === view;
    console.log('Pointer lock:', locked);
    if (locked) {
      pointerLockWarning.style.display = 'none';
    } else {
      pointerLockWarning.style.display = 'flex';
    }
  });
}
