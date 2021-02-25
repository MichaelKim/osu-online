import React from 'react';
import Game from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import { BeatmapFiles } from './BeatmapUpload';
import style from './index.module.scss';
import './index.scss';
import { Sayobot } from './Sayobot';
import Local from './Sources/Local';

type Props = Record<string, never>;

type State = {
  gameLoaded: boolean;
  beatmapLoaded: boolean;
  playing: boolean;
  beatmaps: BeatmapFiles[];
};

export default class Root extends React.Component<Props, State> {
  game = new Game(document.getElementsByTagName('canvas')[0]);
  state: State = {
    gameLoaded: false,
    beatmapLoaded: false,
    playing: false,
    beatmaps: []
  };

  componentDidMount() {
    this.game.init().then(() => this.setState({ gameLoaded: true }));
  }

  onLoad = (beatmaps: BeatmapFiles[]) => {
    this.setState({ beatmaps });
  };

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
        <Local onSelect={this.onSelect} />
        <div className={style.beatmapSection}>
          <Sayobot onSelect={this.onSelect} />
        </div>
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
