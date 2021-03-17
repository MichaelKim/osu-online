import { useContext } from 'react';
import OptionsContext from '../../../options';
import style from './index.module.scss';

export default function AnimationsOption() {
  const { animations, setOptions } = useContext(OptionsContext);

  const onClick = () => setOptions({ animations: !animations });

  return (
    <div
      className={style.rowItem}
      title='Enable UI animations on beatmap list'
      onClick={onClick}
    >
      <p>Enable List Animations</p>
      <input type='checkbox' checked={animations} readOnly />
    </div>
  );
}
