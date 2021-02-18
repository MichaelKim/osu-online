// Timing windows

import { HitResultType } from './HitResultController';
import { lerp, Tuple } from './util';

// Approach Rate values (in ms)
const AR0_FADE = 1800;
const AR5_FADE = 1200;
const AR10_FADE = 450;

const AR0_FULL = 600;
const AR5_FULL = 400;
const AR10_FULL = 150;

// Returns [fadeTime, fullTime]
export function arToMS(ar: number): Tuple<number, 2> {
  if (ar <= 5)
    return [
      lerp(ar, 0, 5, AR0_FADE, AR5_FADE),
      lerp(ar, 0, 5, AR0_FULL, AR5_FULL)
    ];
  return [
    lerp(ar, 5, 10, AR5_FADE, AR10_FADE),
    lerp(ar, 5, 10, AR5_FULL, AR10_FULL)
  ];
}

// Overall Difficulty
const OD0_300 = 80;
const OD10_300 = 20;

const OD0_100 = 140;
const OD10_100 = 60;

const OD0_50 = 200;
const OD10_50 = 100;

export function odToMS(od: number) {
  return {
    [HitResultType.HIT300]: lerp(od, 0, 10, OD0_300, OD10_300),
    [HitResultType.HIT100]: lerp(od, 0, 10, OD0_100, OD10_100),
    [HitResultType.HIT50]: lerp(od, 0, 10, OD0_50, OD10_50)
  };
}

// Circle Size (diameter in osu!pixels)
export function csToSize(cs: number) {
  return 2 * (54.4 - cs * 4.48);
}
