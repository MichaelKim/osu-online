import React from 'react';
import Game from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './BeatmapListing';
import BeatmapLoad, { BeatmapFiles } from './BeatmapUpload';
import './index.scss';

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

  onSelect = async (id: string, data: BeatmapData, audioFile: File) => {
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 900,
            backgroundColor: '#eee',
            boxShadow: '0 0 10px 0 rgb(40 40 40 / 30%)',
            margin: '0 auto',
            padding: '0 40px'
          }}
        >
          <BeatmapLoad onSelect={this.onLoad} />
          <BeatmapListing
            beatmaps={this.state.beatmaps}
            onSelect={this.onSelect}
          />
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
