import * as PIXI from 'pixi.js';
import Beatmap from './Beatmap';
import { ObjectTypes } from './HitObjects';
import { BaseHitSound } from './HitSoundController';
import { parseHitSample, SampleSetType } from './SampleSet';
import TimingPoint from './TimingPoint';

export default class Spinner {
  readonly type = ObjectTypes.SPINNER;

  // Metadata
  readonly x = 256; // Center of playfield
  readonly y = 192;
  t: number;
  endTime: number;
  hitSound: BaseHitSound;

  // Beatmap
  sampleSet: SampleSetType; // Sample set override
  additionSet: SampleSetType;

  // Computed
  rotationsNeeded: number;

  // Sprites
  container: PIXI.Container;

  // Gameplay
  lastPoint: PIXI.Point;
  lastTime: number = 0;
  spinProgress: number = 0;
  finished: number = 0;

  constructor(tokens: string[], timingPoint: TimingPoint, beatmap: Beatmap) {
    // x,y,time,type,hitSound,endTime,hitSample
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;
    this.endTime = parseInt(tokens[5]);

    const hitSample = tokens.length > 6 ? parseHitSample(tokens[6]) : [0, 0];
    this.sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
    this.additionSet = hitSample[1] || this.sampleSet;

    // Compute required rotations (Taken from opsu)
    const spinsPerMinute = 100 + beatmap.od * 15;
    this.rotationsNeeded = (spinsPerMinute * (this.endTime - this.t)) / 60000;

    this.container = new PIXI.Container();
    this.lastPoint = new PIXI.Point();
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.container);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  update(time: number) {
    return false;
  }
}
