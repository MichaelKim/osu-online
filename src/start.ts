// Start icon

export default function initStart(): Promise<void> {
  return new Promise(resolve => {
    const startBtn = document.getElementById('start');
    const osuCircle = document.getElementById('osu-circle');
    startBtn.addEventListener('click', () => {
      osuCircle.style.opacity = '0';
      setTimeout(() => (osuCircle.style.display = 'none'), 0.3);

      resolve();
    });
  });
}
