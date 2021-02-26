import React from 'react';
import style from './index.module.scss';

type Props = {
  children: React.ReactNode;
};

export default function Section({ children }: Props) {
  return <div className={style.section}>{children}</div>;
}
