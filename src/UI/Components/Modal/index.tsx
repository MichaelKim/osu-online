import { ReactNode, useCallback } from 'react';
import style from './index.module.scss';

type Props = {
  children: ReactNode;
  visible: boolean;
  onExit: () => void;
};

export default function Modal({ children, visible, onExit }: Props) {
  const onModalClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  );

  if (!visible) return null;

  return (
    <div className={style.modal} onClick={onExit}>
      <div className={style.modalBox} onClick={onModalClick}>
        {children}
      </div>
    </div>
  );
}
