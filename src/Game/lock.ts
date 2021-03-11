// Locks pointer and enables fullscreen
export async function lockPointer(
  view: HTMLCanvasElement,
  rawInput: boolean
): Promise<void> {
  await document.documentElement.requestFullscreen();

  if (!rawInput) {
    view.requestPointerLock();
    return;
  }

  // @ts-expect-error: Chrome-only
  const promise = view.requestPointerLock({
    unadjustedMovement: true
  });
  // @ts-expect-error: promise is not void in Chrome 88+ (?)
  console.log(promise ? 'locked unadjusted' : 'locked normal');
  await promise;
}

// Check if browser supports unadjusted movement pointer lock
export async function checkUnadjusted() {
  // @ts-expect-error: Chrome-only
  const promise = document.documentElement.requestPointerLock({
    unadjustedMovement: true
  }) as Promise<void> | undefined;
  document.exitPointerLock();

  if (!promise) {
    return false;
  }

  try {
    await promise;
    return true;
  } catch (e) {
    return false;
  }
}

// Display out of focus error
export function initLock(
  view: HTMLCanvasElement,
  rawInput: boolean,
  callback: (paused: boolean) => void
): void {
  const pointerLockWarning = document.getElementById('lock');
  if (pointerLockWarning == null) {
    console.error('Missing lock element');
    return;
  }

  pointerLockWarning.addEventListener('click', () => {
    lockPointer(view, rawInput);
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
