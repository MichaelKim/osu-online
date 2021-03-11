import { ReactNode, useCallback, useEffect, useState } from 'react';
import style from './index.module.scss';

type Props = {
  children: ReactNode;
  visible: boolean;
  keepOpen?: boolean;
  onExit: () => void;
};

export default function Modal({
  children,
  visible,
  keepOpen = false,
  onExit
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const onModalClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  );

  useEffect(() => {
    if (visible) setLoaded(true);
  }, [visible]);

  if (!(loaded && (keepOpen || visible))) return null;

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
