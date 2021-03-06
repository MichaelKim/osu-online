import style from './index.module.scss';

export default function LoadingCircle() {
  return (
    <div className={style.loading}>
      <div className={style.loadingCircle} />
    </div>
  );
}
