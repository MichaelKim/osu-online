export enum SayobotListType {
  HOT = 1,
  NEW = 2, // This ignores mode filter
  PACKS = 3,
  SEARCH = 4
}

export enum SayobotListMode {
  STD = 1,
  TAIKO = 2,
  CTB = 4,
  MANIA = 5 // 8?
}

export enum SayobotListClass {
  RANKED = 1 << 0, // + Approved
  QUALIFIED = 1 << 1,
  LOVED = 1 << 2,
  PENDING = 1 << 3, // + WIP
  GRAVEYARD = 1 << 4
}

type BeatmapListOptions = {
  limit: number;
  offset: number;
  type: SayobotListType;
  keyword: string;
  subType: number;
  mode: SayobotListMode;
  class: number; // Bit flags of SayobotListClass
  genre: number;
  language: number;
};

export type SayobotBeatmapListInfo = {
  approved: number;
  artist: string;
  artistU: string;
  creator: string;
  favourite_count: number;
  lastupdate: number;
  modes: number;
  order: number;
  play_count: number;
  sid: number;
  title: string;
  titleU: string;
};

type BeatmapList = {
  data: SayobotBeatmapListInfo[];
  endId: number;
  status: number;
};

async function getBeatmapList(
  options: Partial<BeatmapListOptions>
): Promise<BeatmapList> {
  const args: string[] = [];
  if (options.limit != null) {
    args.push('L=' + options.limit);
  }
  if (options.offset != null) {
    args.push('O=' + options.offset);
  }
  if (options.type != null) {
    args.push('T=' + options.type);
  }
  if (options.keyword != null) {
    args.push('K=' + options.keyword);
  }
  if (options.mode != null) {
    args.push('M=' + options.mode);
  }
  if (options.class != null) {
    args.push('C=' + options.class);
  }

  const res = await fetch(
    'https://api.sayobot.cn/beatmaplist?' + args.join('&')
  );
  return res.json();
}

export type SayobotDiffInfo = {
  AR: number;
  CS: number;
  HP: number;
  OD: number;
  aim: number;
  audio: string;
  bg: string;
  bid: number;
  circles: number;
  hit300window: number;
  img: string;
  length: number;
  maxcombo: number;
  mode: number;
  passcount: number;
  playcount: number;
  pp: number;
  pp_acc: number;
  pp_aim: number;
  pp_speed: number;
  sliders: number;
  speed: number;
  spinners: number;
  star: number;
  strain_aim: string;
  strain_speed: string;
  version: string;
};

export type SayobotBeatmapInfo = {
  approved: number;
  approved_date: number;
  artist: string;
  artistU: string;
  bid_data: SayobotDiffInfo[];
  bids_amount: number;
  bpm: number;
  creator: string;
  creator_id: number;
  favourite_count: number;
  genre: number;
  language: number;
  last_update: number;
  local_update: number;
  preview: number;
  sid: number;
  source: string;
  storyboard: number;
  tags: string;
  title: string;
  titleU: string;
  video: number;
};

type BeatmapInfo = {
  data: SayobotBeatmapInfo;
  status: number;
};

async function getBeatmapInfo(sid: number): Promise<BeatmapInfo> {
  const res = await fetch('https://api.sayobot.cn/v2/beatmapinfo?K=' + sid);
  const json: BeatmapInfo = await res.json();

  // Sort difficulties by stars
  json.data.bid_data.sort((a, b) => a.star - b.star);

  return json;
}

export async function getSayobotBeatmaps(options: Partial<BeatmapListOptions>) {
  const list = await getBeatmapList(options);
  if (list.data == null) {
    return [];
  }

  // Mode search filter doesn't perfectly work
  const stdMaps = list.data.filter(d => d.modes & SayobotListMode.STD);

  const data = await Promise.all(stdMaps.map(d => getBeatmapInfo(d.sid)));
  return data.map(d => d.data);
}
