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
export function initLock(view: HTMLCanvasElement) {
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
