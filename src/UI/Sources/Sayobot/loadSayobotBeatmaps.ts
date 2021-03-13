import JSZip from 'jszip';
import { BeatmapFile } from '../../../Game';
import { BeatmapData, parseBeatmap } from '../../../Game/Loader/BeatmapLoader';
import { SayobotBeatmapInfo, SayobotDiffInfo } from '../../API/SayobotAPI';
import { BeatmapFiles } from '../../Components/BeatmapUpload';

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
    background,
    length: diffInfo?.length ?? 0
  };
}

export async function fetchOsz(
  sayobotInfo: SayobotBeatmapInfo
): Promise<BeatmapFiles> {
  const res = await fetch(
    'https://txy1.sayobot.cn/beatmaps/download/mini/' + sayobotInfo.sid
  );
  const blob = await res.blob();
  const zip = await JSZip.loadAsync(blob);

  const files = await Promise.all(
    Object.values(zip.files).map(async f => ({
      file: f,
      blob: await f.async('blob')
    }))
  );

  // Find all .osu files
  const diffFiles = files.filter(f => f.file.name.endsWith('.osu'));
  const otherFiles = files
    .filter(f => !f.file.name.endsWith('.osu'))
    .map(f => ({
      name: f.file.name,
      blob: f.blob
    }));

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

  return {
    difficulties: diffs,
    files: otherFiles
  };
}
