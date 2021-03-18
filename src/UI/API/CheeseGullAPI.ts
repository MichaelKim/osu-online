export enum CheeseGullBeatmapStatus {
  GRAVEYARD = -2,
  WIP = -1,
  PENDING = 0,
  RANKED = 1,
  APPROVED = 2,
  QUALIFIED = 3,
  LOVED = 4
}

export enum CheeseGullBeatmapMode {
  STD = 0,
  TAIKO = 1,
  CTB = 2,
  MANIA = 3
}

enum Genre {
  ANY = 0,
  UNSPECIFIED = 1,
  VIDEO_GAME = 2,
  ANIME = 3,
  ROCK = 4,
  POP = 5,
  OTHER = 6,
  NOVELTY = 7,
  HIP_HOP = 9,
  ELECTRONIC = 10,
  METAL = 11,
  CLASSICAL = 12,
  FOLK = 13,
  JAZZ = 14
}

enum Language {
  ANY = 0,
  UNSPECIFIED = 1,
  ENGLISH = 2,
  JAPANESE = 3,
  CHINESE = 4,
  INSTRUMENTAL = 5,
  KOREAN = 6,
  FRENCH = 7,
  GERMAN = 8,
  SWEDISH = 9,
  SPANISH = 10,
  ITALIAN = 11,
  RUSSIAN = 12,
  POLISH = 13,
  OTHER = 14
}

type BeatmapListOptions = {
  amount: number;
  offset: number;
  status: CheeseGullBeatmapStatus[];
  mode: CheeseGullBeatmapMode[];
  query: string;
};

export type CheeseGullBeatmap = {
  BeatmapID: number;
  ParentSetID: number;
  DiffName: string;
  FileMD5: string;
  Mode: CheeseGullBeatmapMode;
  BPM: number;
  AR: number;
  OD: number;
  CS: number;
  HP: number;
  TotalLength: number;
  HitLength: number;
  Playcount: number;
  Passcount: number;
  MaxCombo: number;
  DifficultyRating: number;
};

export type CheeseGullSet = {
  SetID: number;
  ChildrenBeatmaps: CheeseGullBeatmap[];
  RankedStatus: CheeseGullBeatmapStatus;
  ApprovedDate: string;
  LastUpdate: string;
  LastChecked: string;
  Artist: string;
  Title: string;
  Creator: string;
  Source: string;
  Tags: string;
  HasVideo: boolean;
  Genre: Genre;
  Language: Language;
  Favourites: number;
};

export async function getBeatmapList(
  options: Partial<BeatmapListOptions>
): Promise<CheeseGullSet[]> {
  const args: string[] = [];
  if (options.amount != null) {
    args.push('amount=' + options.amount);
  }
  if (options.offset != null) {
    args.push('offset=' + options.offset);
  }
  if (options.status != null) {
    args.push(...options.status.map(s => 'status=' + s));
  }
  if (options.mode != null) {
    args.push(...options.mode.map(s => 'mode=' + s));
  }
  if (options.query != null) {
    args.push('query=' + options.query);
  }

  const res = await fetch(
    'https://storage.ripple.moe/api/search?' + args.join('&')
  );
  const json: CheeseGullSet[] = await res.json();

  // Certain search results are null
  const validMaps = json.filter(set => set.ChildrenBeatmaps);

  validMaps.forEach(set => {
    set.ChildrenBeatmaps.sort(
      (a, b) => a.DifficultyRating - b.DifficultyRating
    );
  });

  return validMaps;
}
