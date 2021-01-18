// Locks pointer and enables fullscreen
export async function lockPointer(view: HTMLCanvasElement) {
  await document.documentElement.requestFullscreen();
  // @ts-ignore: ignore mouse acceleration
  const promise = view.requestPointerLock({
    // TODO: apparently this only works in Chrome
    unadjustedMovement: true
  });
  // @ts-ignore: promise is not void in Chrome 88+ (?)
  console.log(promise ? 'locked unadjusted' : 'locked normal');
  await promise;
}

// Display out of focus error
export function initLock(
  view: HTMLCanvasElement,
  callback: (paused: boolean) => void
) {
  const pointerLockWarning = document.getElementById('lock');
  if (pointerLockWarning == null) {
    console.error('Missing lock element');
    return;
  }

  pointerLockWarning.addEventListener('click', () => {
    lockPointer(view);
    pointerLockWarning.style.display = 'none';
    callback(false);
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === view;
    console.log('Pointer lock:', locked);
    if (!locked) {
      pointerLockWarning.style.display = 'flex';
      callback(true);
    }
  });

  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible';
    console.log('Visible:', visible);
    if (!visible) {
      pointerLockWarning.style.display = 'flex';
      callback(true);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const full = document.fullscreenElement != null;
    console.log('Fullscreen:', full);
    if (!full) {
      pointerLockWarning.style.display = 'flex';
      callback(true);
    }
  });
}
