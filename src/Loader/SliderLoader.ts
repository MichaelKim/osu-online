import * as PIXI from 'pixi.js';
import { CurveTypes, getSliderCurve } from '../Curve';
import {
  APPROACH_R,
  FOLLOW_R,
  getNumberSprites,
  HitObjectTypes,
  initSprite
} from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample, SampleSetType } from '../SampleSet';
import { Skin } from '../Skin';
import { Tuple } from '../util';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

type EdgeSet = Tuple<SampleSetType, 2>; // [normal, addition]

export interface SliderData {
  type: HitObjectTypes.SLIDER;

  // Metadata
  x: number; // Position of the hit circle (initially at points[0])
  y: number;
  points: PIXI.Point[]; // Control points
  t: number;
  hitSound: BaseHitSound;
  sliderType: CurveTypes;
  slides: number; // Total number of slides (0 repeats = 1 slide)
  length: number;
  // TODO: this type is supposed to be like a bitset of BaseHitSounds
  edgeSounds: BaseHitSound[];
  edgeSets: EdgeSet[];

  // Beatmap
  comboIndex: number; // Combo color index
  comboNumber: number; // 1-indexed
  sampleSet: SampleSetType; // Sample set override
  additionSet: SampleSetType;

  // Computed
  sliderTime: number; // Without repeats
  endTime: number; // Time when slider ends
  curve: PIXI.Point[];
  ticks: number[];
}

export interface SliderSprites {
  tickSprites: PIXI.Sprite[];
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Container;
  followSprite: PIXI.Sprite;
  reverseSprite: PIXI.Sprite;
}

export function parseSlider(
  tokens: string[],
  comboNumber: number,
  comboIndex: number,
  timingPoint: TimingPoint,
  beatmap: BeatmapData
): SliderData {
  // x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
  const x = parseFloat(tokens[0]);
  const y = parseFloat(tokens[1]);
  const t = parseInt(tokens[2]);
  const hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;

  const [curveType, ...curveTokens] = tokens[5].split('|');
  const sliderType = curveType as CurveTypes;
  const otherPoints = curveTokens.map(t => {
    const [x, y] = t.split(':');
    return {
      x: parseFloat(x),
      y: parseFloat(y)
    };
  });
  const points = [{ x, y }, ...otherPoints].map(
    ({ x, y }) => new PIXI.Point(x, y)
  );

  const slides = parseInt(tokens[6]);
  const length = parseFloat(tokens[7]);

  let edgeSounds: BaseHitSound[] = [];
  if (tokens.length > 8) {
    edgeSounds = tokens[8].split('|').map(t => parseInt(t));
  }

  let edgeSets: EdgeSet[] = [];
  if (tokens.length > 9) {
    const edgeSetTokens = tokens[9].split('|');
    edgeSets = edgeSetTokens.map(t => {
      const [normal, addition] = t.split(':');
      return [parseInt(normal), parseInt(addition)];
    });
  }

  if (edgeSounds.length !== edgeSets.length) {
    console.warn('Mismatching edge sound lengths', tokens);
  }

  const hitSample = tokens.length > 10 ? parseHitSample(tokens[10]) : [0, 0];
  const sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
  const additionSet = hitSample[1] || hitSample[0];

  // Calculate slider duration
  const sliderTime =
    (timingPoint.beatLength * (length / beatmap.sliderMultiplier)) / 100;

  // Commonly computed value
  const endTime = t + sliderTime * slides;

  // Calculate curve points
  const curve = getSliderCurve(sliderType, points, length);

  // Calculate slider ticks
  const tickDist =
    (100 * beatmap.sliderMultiplier) /
    beatmap.sliderTickRate /
    timingPoint.mult;
  const numTicks = Math.ceil(length / tickDist) - 2; // Ignore start and end
  const ticks = [];
  if (numTicks > 0) {
    const tickOffset = 1 / (numTicks + 1);
    for (let i = 0, t = tickOffset; i < numTicks; i++, t += tickOffset) {
      ticks.push(t);
    }
  }

  return {
    type: HitObjectTypes.SLIDER,
    x,
    y,
    points,
    t,
    hitSound,
    sliderType,
    slides,
    length,
    edgeSounds,
    edgeSets,
    comboIndex,
    comboNumber,
    sampleSet,
    additionSet,
    sliderTime,
    endTime,
    curve,
    ticks
  };
}

export function loadSliderSprites(
  object: SliderData,
  skin: Skin,
  size: number
): SliderSprites {
  // Load sprites
  const circleSprite = initSprite(skin.circle, object.x, object.y, size);
  const approachSprite = initSprite(
    skin.approach,
    object.x,
    object.y,
    size * APPROACH_R
  );
  const followSprite = initSprite(
    skin.sliderFollowCircle,
    object.x,
    object.y,
    size * FOLLOW_R
  );
  const numberSprites = getNumberSprites(
    skin,
    object.comboNumber,
    object.x,
    object.y,
    size
  );

  const tickSprites = object.ticks.map(t => {
    const index = Math.floor(object.curve.length * t);
    const point = object.curve[index];
    return initSprite(skin.sliderScorePoint, point.x, point.y);
  });

  const endPosition = object.curve[object.curve.length - 1];
  // TODO: Should scale with size
  const reverseSprite = initSprite(
    skin.reverseArrow,
    endPosition.x,
    endPosition.y
  );
  const dx = object.points[object.points.length - 2].x - endPosition.x;
  const dy = object.points[object.points.length - 2].y - endPosition.y;
  reverseSprite.rotation = Math.atan2(dy, dx);

  return {
    circleSprite,
    approachSprite,
    followSprite,
    numberSprites,
    tickSprites,
    reverseSprite
  };
}
