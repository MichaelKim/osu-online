import { BeatmapFile } from '../../../Game';
import {
  BeatmapData,
  GameMode,
  parseBeatmap
} from '../../../Game/Loader/BeatmapLoader';
import { CheeseGullBeatmap, CheeseGullSet } from '../../API/CheeseGullAPI';
import { BeatmapDiff, BeatmapFiles } from '../../Components/BeatmapUpload';
import { fetchOSZ } from '../../util';

function loadRippleBeatmapDiff(
  data: BeatmapData,
  info: CheeseGullSet,
  diffInfo: CheeseGullBeatmap | undefined,
  files: BeatmapFile[]
) {
  // Load background image
  const bgFilename = data.background.filename;
  const bgFile = files.find(f => f.name === bgFilename);
  const background = bgFile != null ? URL.createObjectURL(bgFile.blob) : '';

  return {
    info: {
      creator: info.Creator || data.creator,
      version: diffInfo?.DiffName || data.version,
      stars: diffInfo?.DifficultyRating || 0,
      background,
      length: diffInfo?.HitLength ?? 0
    },
    data
  };
}

export async function fetchRipple(
  cheeseGullInfo: CheeseGullSet
): Promise<BeatmapFiles> {
  const { diffFiles, otherFiles } = await fetchOSZ(
    'https://txy1.sayobot.cn/beatmaps/download/mini/' + cheeseGullInfo.SetID
    // 'https://storage.ripple.moe/d/' + cheeseGullInfo.SetID
  );

  // Parse diffs
  const diffs: BeatmapDiff[] = [];

  for (const diff of diffFiles) {
    const text = await diff.text();
    const data = parseBeatmap(text);

    if (data.mode === GameMode.STANDARD) {
      const diffInfo = cheeseGullInfo.ChildrenBeatmaps.find(
        d => d.DiffName === data.version
      );
      diffs.push(
        loadRippleBeatmapDiff(data, cheeseGullInfo, diffInfo, otherFiles)
      );
    }
  }

  diffs.sort((a, b) => a.info.stars - b.info.stars);

  return {
    info: {
      id: cheeseGullInfo.SetID,
      title: cheeseGullInfo.Title,
      artist: cheeseGullInfo.Artist,
      creator: cheeseGullInfo.Creator,
      background: diffs[0].info.background
    },
    difficulties: diffs,
    files: otherFiles
  };
}
