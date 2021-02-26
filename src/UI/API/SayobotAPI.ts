type BeatmapListOptions = {
  limit: number;
  offset: number;
  type: number;
  keyword: string;
  subType: number;
  mode: number;
  class: number;
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

export async function getBeatmapList(
  options: Partial<BeatmapListOptions>
): Promise<BeatmapList> {
  let args = '';
  if (options.limit != null) {
    args += 'L=' + options.limit;
  }
  if (options.offset != null) {
    args += 'O=' + options.offset;
  }
  if (options.type != null) {
    args += 'T=' + options.type;
  }
  if (options.mode != null) {
    args += 'M=' + options.mode;
  }

  const res = await fetch('https://api.sayobot.cn/beatmaplist?' + args);
  return res.json();
}

type SayobotBeatmapData = {
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
  bid_data: SayobotBeatmapData[];
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

export async function getBeatmapInfo(sid: number): Promise<BeatmapInfo> {
  const res = await fetch('https://api.sayobot.cn/v2/beatmapinfo?K=' + sid);
  const json: BeatmapInfo = await res.json();

  // Sort difficulties by stars
  json.data.bid_data.sort((a, b) => a.star - b.star);

  return json;
}
