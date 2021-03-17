import { StrictMode, useState } from 'react';
import ReactDOM from 'react-dom';
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

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('app')
);
