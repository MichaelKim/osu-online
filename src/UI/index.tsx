import React from 'react';
import Game from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import Search from './Components/Search';
import Section from './Components/Section';
import './index.scss';
import Local from './Sources/Local';
import Sayobot from './Sources/Sayobot';

type Props = Record<string, never>;

type State = {
  gameLoaded: boolean;
  beatmapLoaded: boolean;
  playing: boolean;
};

export default class Root extends React.Component<Props, State> {
  game = new Game(document.getElementsByTagName('canvas')[0]);
  state: State = {
    gameLoaded: false,
    beatmapLoaded: false,
    playing: false
  };

  componentDidMount() {
    this.game.init().then(() => this.setState({ gameLoaded: true }));
  }

  onSelect = async (data: BeatmapData, audioFile: Blob) => {
    this.game.loadBeatmap(data);

    // Load audio
    const buffer = await audioFile.arrayBuffer();
    await this.game.audio.loadBlob(data.audioFilename, buffer);
    this.setState({ beatmapLoaded: true });
  };

  onSearch = (keyword: string) => {
    console.log(keyword);
  };

  render() {
    return (
      <div
        style={{
          display: this.state.playing ? 'none' : 'block'
        }}
      >
        <h1>osu!</h1>

        <Section>
          <Search onChange={this.onSearch} />
        </Section>
        <Section>
          <Local onSelect={this.onSelect} />
        </Section>
        <Section>
          <Sayobot onSelect={this.onSelect} />
        </Section>

        {this.state.gameLoaded ? (
          <>
            <p>Game loaded</p>
            {this.state.beatmapLoaded ? (
              <>
                <p>Beatmap loaded</p>
                <button
                  onClick={() => {
                    this.setState({ playing: true });
                    this.game.play();
                  }}
                >
                  Start!
                </button>
              </>
            ) : (
              <p>Beatmap loading</p>
            )}
          </>
        ) : (
          <p>Game loading</p>
        )}
      </div>
    );
  }
}
