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
        <div onClick={onResume}>
          <p>Continue</p>
        </div>
        <div onClick={onRetry}>
          <p>Retry</p>
        </div>
        <div onClick={onQuit}>
          <p>Quit</p>
        </div>
      </div>
    </div>
  );
}
