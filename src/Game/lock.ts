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

export async function unlockPointer() {
  await document.exitFullscreen();
  document.exitPointerLock();
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

export function onPause(callback: () => void) {
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement !== null;
    console.log('Pointer lock:', locked);
    if (!locked) {
      callback();
    }
  });

  document.addEventListener('visibilitychange', () => {
    const visible = document.visibilityState === 'visible';
    console.log('Visible:', visible);
    if (!visible) {
      callback();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const full = document.fullscreenElement != null;
    console.log('Fullscreen:', full);
    if (!full) {
      callback();
    }
  });

  document.addEventListener('blur', () => {
    console.log('doc blur');
    callback();
  });

  window.addEventListener('blur', () => {
    console.log('window blur');
    callback();
  });
}
