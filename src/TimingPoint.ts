enum SampleSet {
  DEFAULT = 0,
  NORMAL = 1,
  SOFT = 2,
  DRUM = 3
}

enum Effects {
  KIAI = 1 << 0
  // OMIT_FIRST = 1 << 3
}

export default class TimingPoint {
  time: number;
  beatLength: number;
  velocity: number; // negative inverse slider velocity multiplier, as a percentage
  meter: number;
  sampleSet: SampleSet;
  sampleIndex: number;
  volume: number;
  inherited: boolean;
  kiai: boolean;

  constructor(tokens: string[]) {
    // time,beatLength,meter,sampleSet,sampleIndex,volume,uninherited,effects
    this.time = parseFloat(tokens[0]);

    this.meter = parseInt(tokens[2]);
    this.sampleSet = parseInt(tokens[3]);
    this.sampleIndex = parseInt(tokens[4]);
    this.volume = parseInt(tokens[5]);
    // this.inherited = parseInt(tokens[6]);
    if (tokens.length > 7) {
      const effects = parseInt(tokens[7]);
      this.kiai = (effects & Effects.KIAI) > 0;
    }

    // tokens[1] is either beatLength (positive) or velocity (negative)
    const beatLength = parseFloat(tokens[1]);
    if (beatLength > 0) {
      this.beatLength = beatLength;
      this.inherited = false;
    } else {
      this.velocity = beatLength;
      this.inherited = true;
    }
  }
}
