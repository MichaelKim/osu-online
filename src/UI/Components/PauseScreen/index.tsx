import style from './index.module.scss';

type Props = {
  onResume: () => void;
  onRetry: () => void;
  onQuit: () => void;
};

export function PauseScreen({ onResume, onRetry, onQuit }: Props) {
  return (
    <div className={style.lock}>
      <div className={style.lockMessage}>
        <div className={style.bar} onClick={onResume}>
          <div className={style.resume}>
            <p>Continue</p>
          </div>
        </div>
        <div className={style.bar} onClick={onRetry}>
          <div className={style.retry}>
            <p>Retry</p>
          </div>
        </div>
        <div className={style.bar} onClick={onQuit}>
          <div className={style.quit}>
            <p>Quit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
