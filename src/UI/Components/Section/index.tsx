import { ReactNode } from 'react';
import style from './index.module.scss';

type Props = {
  children: ReactNode;
};

export default function Section({ children }: Props) {
  return <div className={style.section}>{children}</div>;
}
