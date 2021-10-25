import { BeatmapDiff } from '.';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import { loadHitObjectsData } from '../../../Game/Loader/HitObjectLoader';

export type Directory = {
  name: string;
  files: Record<string, File | Directory>;
};

type BeatmapInfo = Record<
  string,
  {
    diffs: File[];
    files: BeatmapFile[];
  }
>;

function searchForBeatmaps(
  beatmaps: BeatmapInfo,
  dir: Directory,
  currentPath = ''
) {
  const files = Object.values(dir.files);

  const beatmapExists = files.some(
    file => file instanceof File && file.name.endsWith('.osu')
  );

  if (!beatmapExists) {
    for (const subdir of files) {
      if (!(subdir instanceof File)) {
        searchForBeatmaps(beatmaps, subdir, currentPath + '/' + subdir.name);
      }
    }
    return;
  }

  if (beatmaps[currentPath] != null) {
    console.warn('Already encountered folder:', currentPath);
  }

  beatmaps[currentPath] = {
    diffs: [],
    files: []
  };

  for (const file of files) {
    if (file instanceof File) {
      if (file.name.endsWith('.osu')) {
        beatmaps[currentPath].diffs.push(file);
      } else {
        beatmaps[currentPath].files.push({
          name: file.name,
          blob: file
        });
      }
    } else {
      // Get all files relative to this directory
      beatmaps[currentPath].files.push(...getAllFiles(file));
    }
  }
}

function getAllFiles(dir: Directory, currentPath = ''): BeatmapFile[] {
  return Object.values(dir.files).flatMap(file => {
    const name = currentPath + '/' + file.name;

    if (file instanceof File) {
      return {
        name,
        blob: file
      };
    }

    return getAllFiles(file, name);
  });
}

export function getBeatmaps(root: Directory) {
  const beatmaps: BeatmapInfo = {};
  searchForBeatmaps(beatmaps, root);
  return Object.values(beatmaps);
}

export function loadBeatmapDiff(
  data: BeatmapData,
  files: BeatmapFile[]
): BeatmapDiff {
  // Load background image
  const bgFilename = data.background.filename;
  const bgFile = files.find(f => f.name === bgFilename);
  const background = bgFile != null ? URL.createObjectURL(bgFile.blob) : '';

  // Load hit objects
  const notes = loadHitObjectsData(data);
  const [first, last] = notes.reduce(
    ([min, max], note) => [Math.min(min, note.t), Math.max(max, note.t)],
    [Infinity, 0]
  );

  return {
    info: {
      creator: data.creator,
      version: data.version,
      stars: 0,
      background,
      length: (last - first) / 1000
    },
    data
  };
}
