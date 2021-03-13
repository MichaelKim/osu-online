import { useEffect, useState } from 'react';
import style from './index.module.scss';

type Props = {
  children: React.ReactNode;
  visible: boolean;
  keepOpen?: boolean;
  className?: string;
  onExit: () => void;
};

export default function Modal({
  children,
  visible,
  keepOpen = false,
  className = '',
  onExit
}: Props) {
  const [loaded, setLoaded] = useState(false);

  const onModalClick = (e: React.MouseEvent<HTMLDivElement>) =>
    e.stopPropagation();

  const _onExit = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onExit();
  };

  useEffect(() => {
    if (visible) setLoaded(true);
  }, [visible]);

  if (!(loaded && (keepOpen || visible))) return null;

  return (
    <div
      className={style.modal}
      style={{ display: visible ? 'flex' : 'none' }}
      onClick={_onExit}
    >
      <div className={style.modalBox + ' ' + className} onClick={onModalClick}>
        {children}
      </div>
    </div>
  );
}
