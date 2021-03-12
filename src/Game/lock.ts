import { CursorType } from '../UI/options';

// Locks pointer and enables fullscreen
export async function lockPointer(
  view: HTMLCanvasElement,
  cursorType: CursorType
): Promise<void> {
  await document.documentElement.requestFullscreen();

  if (cursorType === CursorType.DEFAULT) {
    return;
  }

  if (cursorType === CursorType.LOCKED) {
    console.log(view.requestPointerLock());
    return;
  }

  // @ts-expect-error: Chrome-only
  const promise = view.requestPointerLock({
    unadjustedMovement: true
  }) as Promise<void> | undefined;
  console.log(promise ? 'locked unadjusted' : 'locked normal');
  await promise;
}

// Check if browser supports unadjusted movement pointer lock
export async function checkUnadjusted(): Promise<boolean> {
  return new Promise(resolve => {
    function exitPointerLock() {
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('pointerlockerror', onError);
      document.exitPointerLock();
    }

    function onChange() {
      exitPointerLock();
      resolve(true);
    }

    function onError() {
      exitPointerLock();
      resolve(false);
    }

    document.addEventListener('pointerlockchange', onChange);
    document.addEventListener('pointerlockerror', onError);

    // @ts-expect-error: Chrome-only
    const promise = document.documentElement.requestPointerLock({
      unadjustedMovement: true
    }) as Promise<void> | undefined;

    if (!promise) {
      return resolve(false);
    }

    exitPointerLock();

    promise
      .catch(e => {
        console.error(e);
        resolve(false);
      })
      .finally(() => {
        resolve(true);
      });
  });
}

// Display out of focus error
export function initLock(
  view: HTMLCanvasElement,
  cursorType: CursorType,
  callback: (paused: boolean) => void
): void {
  const pointerLockWarning = document.getElementById('lock');
  if (pointerLockWarning == null) {
    console.error('Missing lock element');
    return;
  }

  pointerLockWarning.addEventListener('click', () => {
    lockPointer(view, cursorType);
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
