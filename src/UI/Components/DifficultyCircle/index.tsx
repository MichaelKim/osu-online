import ReactTooltip from 'react-tooltip';
import style from './index.module.scss';

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
  beatmapID: number;
  version?: string;
  stars: number;
  size?: number;
};

export default function DifficultyCircle({
  beatmapID,
  version,
  stars,
  size = 12
}: Props) {
  const color = getDiffColor(stars);
  const roundedStars = Math.floor(stars * 100) / 100;
  const key = `${beatmapID}-${version}`;

  return (
    <>
      <div
        className={style.difficultyCircle}
        style={{
          borderColor: color,
          width: size,
          height: size,
          borderWidth: size / 5
        }}
        data-tip
        data-for={key}
      />
      {version && (
        <ReactTooltip id={key} effect='solid' className={style.tooltip}>
          <p>{version}</p>
          <p>{roundedStars} *</p>
        </ReactTooltip>
      )}
    </>
  );
}
