import { Stats } from '../../../Game';
import { HitResultType } from '../../../Game/HitResultController';
import Modal from '../Modal';
import style from './index.module.scss';

type ItemProps = {
  title: string;
  children: React.ReactNode;
};

function ResultItem({ title, children }: ItemProps) {
  return (
    <div className={style.item}>
      <div className={style.itemTitle}>
        <p>{title}</p>
      </div>
      {children}
    </div>
  );
}

function ResultFraction({ top, bot }: { top: number; bot: number }) {
  return (
    <div className={style.frac}>
      <p className={style.top}>{top}</p>
      <p className={style.bot}>/{bot}</p>
    </div>
  );
}

type Props = {
  result: Stats | null;
  onClose: () => void;
};

export default function ResultModal({ result, onClose }: Props) {
  if (result == null) return null;

  const accuracy = (result.gameResult.accuracy * 100).toLocaleString('en-US', {
    maximumFractionDigits: 2
  });
  const score = Math.floor(result.gameResult.score).toLocaleString('en-US');

  const ticksHit = result.gameResult.hits[HitResultType.TICK_HIT];
  const ticksTotal = ticksHit + result.gameResult.hits[HitResultType.TICK_MISS];

  const endsHit = result.gameResult.hits[HitResultType.LAST_EDGE_HIT];
  const endsTotal =
    endsHit + result.gameResult.hits[HitResultType.LAST_EDGE_MISS];

  return (
    <Modal visible onExit={onClose}>
      <div className={style.resultsModal}>
        <h1 className={style.title}>{result.beatmapData.title}</h1>
        <h2 className={style.artist}>{result.beatmapData.artist}</h2>
        <p className={style.score}>{score}</p>
        <h2 className={style.version}>{result.beatmapData.version}</h2>
        <p>
          Mapped by <b>{result.beatmapData.creator}</b>
        </p>
        <div className={style.row}>
          <ResultItem title='Accuracy'>
            <p className={style.top}>{accuracy}%</p>
          </ResultItem>
          <ResultItem title='Combo'>
            <ResultFraction
              top={result.gameResult.highestCombo}
              bot={result.gameResult.maxCombo}
            />
          </ResultItem>
        </div>
        <div className={style.row}>
          <ResultItem title='Great'>
            <p className={style.top}>
              {result.gameResult.hits[HitResultType.HIT300]}
            </p>
          </ResultItem>
          <ResultItem title='Ok'>
            <p className={style.top}>
              {result.gameResult.hits[HitResultType.HIT100]}
            </p>
          </ResultItem>
          <ResultItem title='Meh'>
            <p className={style.top}>
              {result.gameResult.hits[HitResultType.HIT50]}
            </p>
          </ResultItem>
          <ResultItem title='Miss'>
            <p className={style.top}>
              {result.gameResult.hits[HitResultType.MISS]}
            </p>
          </ResultItem>
        </div>
        <div className={style.row}>
          <ResultItem title='Slider Tick'>
            <ResultFraction top={ticksHit} bot={ticksTotal} />
          </ResultItem>
          <ResultItem title='Slider End'>
            <ResultFraction top={endsHit} bot={endsTotal} />
          </ResultItem>
          <ResultItem title='Spinner Bonus'>
            <p className={style.top}>
              {result.gameResult.hits[HitResultType.SPIN_BONUS]}
            </p>
          </ResultItem>
          <ResultItem title='Spinner Spin'>
            <p className={style.top}>
              {result.gameResult.hits[HitResultType.SPIN_TICK]}
            </p>
          </ResultItem>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
