import { BeatmapFile } from '../../../Game';
import { BeatmapData, parseBeatmap } from '../../../Game/Loader/BeatmapLoader';
import { SayobotBeatmapInfo, SayobotDiffInfo } from '../../API/SayobotAPI';
import { BeatmapFiles } from '../../Components/BeatmapUpload';
import { fetchOSZ } from '../../util';

function loadBeatmapInfo(
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
    creator: info.creator || data.creator,
    version: diffInfo?.version || data.version,
    stars: diffInfo?.star || 0,
    background,
    length: diffInfo?.length ?? 0
  };
}

export async function fetchSayobot(
  sayobotInfo: SayobotBeatmapInfo
): Promise<BeatmapFiles> {
  const { diffFiles, otherFiles } = await fetchOSZ(
    'https://txy1.sayobot.cn/beatmaps/download/mini/' + sayobotInfo.sid
  );

  // Parse diffs
  const diffs = await Promise.all(
    diffFiles.map(async d => {
      const text = await d.blob.text();
      const data = parseBeatmap(text.split('\n').map(l => l.trim()));

      const diffInfo = sayobotInfo.bid_data.find(
        d => d.version === data.version
      );
      const info = loadBeatmapInfo(data, sayobotInfo, diffInfo, otherFiles);

      return {
        info,
        data
      };
    })
  );

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
