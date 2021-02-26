import React from 'react';
import Game from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './Components/BeatmapListing';
import './index.scss';

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

  render() {
    return (
      <div
        style={{
          display: this.state.playing ? 'none' : 'block'
        }}
      >
        <h1>osu!</h1>

        <BeatmapListing onSelect={this.onSelect} />

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
