import React from 'react';
import style from './index.module.scss';
import ReactTooltip from 'react-tooltip';

enum DifficultyColor {
  EASY = '#88b300',
  NORMAL = '#6cf',
  HARD = '#fc2',
  INSANE = '#f6a',
  EXPERT = '#a8f',
  EXPERTPLUS = '#000'
}

function getDiffColor(stars: number) {
  if (stars < 2) return DifficultyColor.EASY;
  if (stars < 2.7) return DifficultyColor.NORMAL;
  if (stars < 4) return DifficultyColor.HARD;
  if (stars < 5.3) return DifficultyColor.INSANE;
  if (stars < 6.5) return DifficultyColor.EXPERT;
  return DifficultyColor.EXPERTPLUS;
}

type Props = {
  id: number;
  version: string;
  stars: number;
  onClick: (diffID: number) => void;
};

export default function DifficultyCircle({
  id,
  version,
  stars,
  onClick
}: Props) {
  const _onClick = React.useCallback(() => onClick(id), [id, onClick]);

  const color = getDiffColor(stars);
  const roundedStars = Math.floor(stars * 100) / 100;

  return (
    <>
      <div
        onClick={_onClick}
        className={style.difficultyCircle}
        style={{ borderColor: color }}
        data-tip
        data-for={`${id}-${version}`}
      />
      <ReactTooltip
        id={`${id}-${version}`}
        effect='solid'
        className={style.tooltip}
      >
        <p>{version}</p>
        <p>{roundedStars} *</p>
      </ReactTooltip>
    </>
  );
}
