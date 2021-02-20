import React from 'react';
import Game from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapInfo, { BeatmapFiles } from './BeatmapInfo';

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

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files == null) {
      return;
    }

    const directories: Record<string, BeatmapFiles> = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Use directory name as ID
      // @ts-expect-error: non-standard API
      const path: string = file.webkitRelativePath;
      const regex = path.match(/^(.+\/)?(\d+) (.+)\/.+\.(.+)$/);
      if (regex) {
        const id = regex[2];
        const title = regex[3];
        const ext = regex[4];

        directories[id] ??= {
          id,
          title,
          beatmapFiles: [],
          otherFiles: []
        };

        if (ext === 'osu') {
          directories[id].beatmapFiles.push(file);
        } else {
          directories[id].otherFiles.push(file);
        }
      }
    }

    // Filter folders that don't contain .osu files
    const beatmaps = Object.values(directories).filter(
      b => b.beatmapFiles.length > 0
    );

    this.setState({ beatmaps });
  };

  onSelect = async (
    id: string,
    title: string,
    data: BeatmapData,
    audioFile: File
  ) => {
    this.game.loadBeatmap(data);

    // Load audio
    const buffer = await audioFile.arrayBuffer();
    await this.game.audio.loadBlob(data.audioFilename, buffer);
    this.setState({ beatmapLoaded: true });
    await this.game.play();
  };

  render() {
    return (
      <div
        style={{
          display: this.state.playing ? 'none' : 'block'
        }}
      >
        <h1>osu!</h1>
        <input
          type='file'
          // @ts-expect-error: non-standard API
          webkitdirectory='true'
          onChange={this.onChange}
        />
        {this.state.beatmaps.map(b => (
          <BeatmapInfo key={b.id} info={b} onSelect={this.onSelect} />
        ))}
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
