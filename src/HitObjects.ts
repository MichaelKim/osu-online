export interface Stats {
  ar: number;
  od: number;
  cs: number;
  sliderMultiplier: number;
}

export enum HitSound {
  NORMAL = 1 << 0,
  WHISTLE = 1 << 1,
  FINISH = 1 << 2,
  CLAP = 1 << 3
}
