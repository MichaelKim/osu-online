import { ReactNode, useCallback, useEffect, useState } from 'react';
import style from './index.module.scss';

type Props = {
  children: ReactNode;
  visible: boolean;
  onExit: () => void;
};

export default function Modal({ children, visible, onExit }: Props) {
  const [loaded, setLoaded] = useState(false);
  const onModalClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  );

  // Lazily load
  useEffect(() => {
    if (visible) setLoaded(true);
  }, [visible]);

  if (!loaded) return null;

  return (
    <div
      className={style.modal}
      style={{ display: visible ? 'flex' : 'none' }}
      onClick={onExit}
    >
      <div className={style.modalBox} onClick={onModalClick}>
        {children}
      </div>
    </div>
  );
}
