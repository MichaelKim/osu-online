import { render } from 'preact';
import { useState } from 'preact/hooks';
import { checkUnadjusted } from './Game/lock';
import './index.scss';
import Root from './UI';

function App() {
  const [clicked, setClicked] = useState(false);
  const [rawInput, setRawInput] = useState(false);

  const onClick = async () => {
    const supportsRawInput = await checkUnadjusted();
    setRawInput(supportsRawInput);
    setClicked(true);
  };

  if (clicked) return <Root supportsRawInput={rawInput} />;
  return (
    <div className='center'>
      <div id='osu-circle' onClick={onClick}>
        <input type='image' id='start' alt='Start' src='osu.webp' />
      </div>
    </div>
  );
}

const app = document.getElementById('app');
app && render(<App />, app);
