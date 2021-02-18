// Start icon

export default function initStart(): Promise<void> {
  return new Promise(resolve => {
    const startBtn = document.getElementById('start');
    const osuCircle = document.getElementById('osu-circle');

    if (startBtn == null || osuCircle == null) {
      console.error('Missing start elements');
      return;
    }

    startBtn.addEventListener('click', () => {
      osuCircle.style.opacity = '0';
      setTimeout(() => {
        osuCircle.style.display = 'none';
        resolve();
      }, 0.3);
    });
  });
}
