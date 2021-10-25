import { BeatmapFile } from '../../../Game';
import {
  BeatmapData,
  GameMode,
  parseBeatmap
} from '../../../Game/Loader/BeatmapLoader';
import { SayobotBeatmapInfo, SayobotDiffInfo } from '../../API/SayobotAPI';
import { BeatmapDiff, BeatmapFiles } from '../../Components/BeatmapUpload';
import { fetchOSZ } from '../../util';

function loadSayobotBeatmapDiff(
  data: BeatmapData,
  info: SayobotBeatmapInfo,
  diffInfo: SayobotDiffInfo | undefined,
  files: BeatmapFile[]
) {
  // Load background image
  const bgFilename = data.background.filename;
  const bgFile = files.find(f => f.name === bgFilename);
  const background = bgFile != null ? URL.createObjectURL(bgFile.blob) : '';

  return {
    info: {
      creator: info.creator || data.creator,
      version: diffInfo?.version || data.version,
      stars: diffInfo?.star || 0,
      background,
      length: diffInfo?.length ?? 0
    },
    data
  };
}

export async function fetchSayobot(
  sayobotInfo: SayobotBeatmapInfo
): Promise<BeatmapFiles> {
  const { diffFiles, otherFiles } = await fetchOSZ(
    'https://txy1.sayobot.cn/beatmaps/download/mini/' + sayobotInfo.sid
  );

  // Parse diffs
  const diffs: BeatmapDiff[] = [];

  for (const diff of diffFiles) {
    const text = await diff.text();
    const data = parseBeatmap(text);

    if (data.mode === GameMode.STANDARD) {
      const diffInfo = sayobotInfo.bid_data.find(
        d => d.version === data.version
      );
      diffs.push(
        loadSayobotBeatmapDiff(data, sayobotInfo, diffInfo, otherFiles)
      );
    }
  }

  diffs.sort((a, b) => a.info.stars - b.info.stars);

  return {
    info: {
      id: sayobotInfo.sid,
      title: sayobotInfo.title,
      artist: sayobotInfo.artist,
      creator: sayobotInfo.creator,
      background: diffs[0].info.background
    },
    difficulties: diffs,
    files: otherFiles
  };
}
