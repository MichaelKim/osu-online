import * as PIXI from 'pixi.js';
import { CurveTypes, getSliderCurve } from '../Curve';
import {
  APPROACH_R,
  FOLLOW_R,
  getNumberSprites,
  HitObjectTypes,
  initCircleSprite,
  initSprite,
  STACK_OFFSET_MULT
} from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample, SampleSetType } from '../SampleSet';
import Skin from '../Skin';
import ReverseArrow from '../Sprites/ReverseArrow';
import { clamp, clerp01, lerp, Tuple } from '../util';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

type EdgeSet = Tuple<SampleSetType, 2>; // [normal, addition]

export interface SliderData {
  type: HitObjectTypes.SLIDER;

  // Metadata
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
  comboNumber: number; // 1-indexed
  comboIndex: number; // Combo color index
  sampleSet: SampleSetType; // Sample set override
  additionSet: SampleSetType;
  stackCount: number;

  // Computed
  sliderTime: number; // Without repeats
  endTime: number; // Time when slider ends
  curve: PIXI.Point[];
  ticks: number[];
}

export interface SliderSprites {
  container: PIXI.Container;
  mesh: PIXI.Mesh;
  tickSprites: PIXI.Sprite[];
  circleSprite: PIXI.Container;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Container;
  ballSprite: PIXI.Sprite;
  followSprite: PIXI.Sprite;
  reverseSprites: ReverseArrow;
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
    points,
    t,
    hitSound,
    sliderType,
    slides,
    length,
    edgeSounds,
    edgeSets,
    comboNumber,
    comboIndex,
    sampleSet,
    additionSet,
    stackCount: 0,
    sliderTime,
    endTime,
    curve,
    ticks
  };
}

// vertex shader source
const vertexSrc = `
    attribute vec2 position;
    attribute float tex_position;
    
    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying float tex_pos;
    void main() {
        tex_pos = tex_position;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(position, 1.0)).xy, -tex_position, 1.0);
    }`;

// fragment shader source
const fragmentSrc = `
    uniform sampler2D uSampler;

    varying float tex_pos;
    void main() {
        gl_FragColor = texture2D(uSampler, vec2(tex_pos, 0.0));
    }`;

const program = PIXI.Program.from(vertexSrc, fragmentSrc);

// Custom mesh that clears the depth buffer before drawing
class CustomMesh extends PIXI.Mesh {
  protected _render(renderer: PIXI.Renderer): void {
    // TODO: batching?
    this._renderDefault(renderer);
  }

  protected _renderDefault(renderer: PIXI.Renderer): void {
    const shader = this.shader;

    // @ts-expect-error
    shader.alpha = this.worldAlpha;
    // @ts-expect-error
    shader.update?.();

    renderer.batch.flush();
    // @ts-expect-error
    if (shader.program.uniformData.translationMatrix) {
      shader.uniforms.translationMatrix = this.transform.worldTransform.toArray(
        true
      );
    }

    renderer.shader.bind(shader);
    // Clear depth buffer before drawing
    // renderer.gl.clearDepth(1);
    renderer.gl.clear(renderer.gl.DEPTH_BUFFER_BIT);
    renderer.gl.colorMask(false, false, false, false);

    renderer.state.set(this.state);

    renderer.geometry.bind(this.geometry, shader);
    renderer.geometry.draw(
      this.drawMode,
      this.size,
      this.start,
      this.geometry.instanceCount
    );

    renderer.gl.depthFunc(renderer.gl.EQUAL);
    renderer.gl.colorMask(true, true, true, true);

    renderer.geometry.draw(
      this.drawMode,
      this.size,
      this.start,
      this.geometry.instanceCount
    );

    renderer.gl.depthFunc(renderer.gl.LESS);
  }
}

function darken(r: number, g: number, b: number, amount: number) {
  const scale = 1 / (1 + amount);
  return [
    clamp(r * scale, 0, 1),
    clamp(g * scale, 0, 1),
    clamp(b * scale, 0, 1)
  ];
}

function lighten(r: number, g: number, b: number, amount: number) {
  return [
    clamp(r * (1 + 0.25 * amount) + 0.5 * amount, 0, 1),
    clamp(g * (1 + 0.25 * amount) + 0.5 * amount, 0, 1),
    clamp(b * (1 + 0.25 * amount) + 0.5 * amount, 0, 1)
  ];
}

function createLegacySliderTexture(skin: Skin, color: number) {
  // osu!stable sliders have
  // - a shadow portion past the slider border
  // - change color to create a gradient (constant alpha)
  const SHADOW_PORTION = 5 / 64; // Hit circles hitboxes are 128x128, but the sprite is 118x118
  const BORDER_PORTION = SHADOW_PORTION + 0.128 * 0.77;
  const BLUR_RATE = 0.03;

  const borderColor = skin.sliderBorder;
  const [borderR, borderG, borderB] = PIXI.utils.hex2rgb(borderColor);
  const trackColor = skin.sliderTrackOverride ?? color;
  const [trackR, trackG, trackB] = PIXI.utils.hex2rgb(trackColor);

  const WIDTH = 200;
  const buffer = new Uint8Array(WIDTH * 4); // 200 pixels * 4 values (rgba)

  function getColor(position: number) {
    if (position <= SHADOW_PORTION) {
      return [0, 0, 0, (0.25 * position) / SHADOW_PORTION];
    }
    if (position <= BORDER_PORTION) {
      return [borderR, borderG, borderB, 1];
    }

    const [outerR, outerG, outerB] = darken(trackR, trackG, trackB, 0.1);
    const [innerR, innerG, innerB] = lighten(trackR, trackG, trackB, 0.5);
    const t = clerp01(position, BORDER_PORTION, 1);
    const r = lerp(t, 0, 1, outerR, innerR);
    const g = lerp(t, 0, 1, outerG, innerG);
    const b = lerp(t, 0, 1, outerB, innerB);
    return [r, g, b, 0.7];
  }

  for (let i = 0; i < WIDTH; i++) {
    const position = i / WIDTH;
    let [r, g, b, a] = getColor(position);

    // Premultiply alpha
    r *= a;
    g *= a;
    b *= a;

    // "Antialiasing"
    if (
      position - SHADOW_PORTION > 0 &&
      position - SHADOW_PORTION < BLUR_RATE
    ) {
      // Blur outer edge
      const t = (position - SHADOW_PORTION) / BLUR_RATE;
      const [sr, sg, sb, sa] = getColor(SHADOW_PORTION);
      r = lerp(t, 0, 1, sr, r);
      g = lerp(t, 0, 1, sg, g);
      b = lerp(t, 0, 1, sb, b);
      a = lerp(t, 0, 1, sa, a);
    } else if (
      position - BORDER_PORTION > 0 &&
      position - BORDER_PORTION < BLUR_RATE
    ) {
      // Blur inner edge
      const t = (position - BORDER_PORTION) / BLUR_RATE;
      const [br, bg, bb, ba] = getColor(BORDER_PORTION);
      r = lerp(t, 0, 1, br, r);
      g = lerp(t, 0, 1, bg, g);
      b = lerp(t, 0, 1, bb, b);
      a = lerp(t, 0, 1, ba, a);
    }

    buffer[i * 4] = r * 255;
    buffer[i * 4 + 1] = g * 255;
    buffer[i * 4 + 2] = b * 255;
    buffer[i * 4 + 3] = a * 255;
  }
  return PIXI.Texture.fromBuffer(buffer, WIDTH, 1);
}

function createSliderTexture(skin: Skin, color: number) {
  // osu!lazer sliders
  // - have no shadow portion
  // - change alpha to create a gradient (constant rgb)
  const BORDER_PORTION = 0.128;
  const EDGE_OPACITY = 0.8;
  const CENTER_OPACITY = 0.3;
  const BLUR_RATE = 0.03;

  const WIDTH = 200;
  const buffer = new Uint8Array(WIDTH * 4); // 200 pixels * 4 values (rgba)

  const borderColor = skin.sliderBorder;
  const [borderR, borderG, borderB] = PIXI.utils.hex2rgb(borderColor);
  const trackColor = skin.sliderTrackOverride ?? color;
  const [trackR, trackG, trackB] = PIXI.utils.hex2rgb(trackColor);

  function getColor(position: number) {
    if (position <= BORDER_PORTION) {
      return [borderR, borderG, borderB, 1];
    }

    const t = lerp(position, BORDER_PORTION, 1, EDGE_OPACITY, CENTER_OPACITY);
    return [trackR, trackG, trackB, t];
  }

  for (let i = 0; i < WIDTH; i++) {
    const position = i / WIDTH;
    let [r, g, b, a] = getColor(position);

    // Premultiply alpha
    r *= a;
    g *= a;
    b *= a;

    // "Antialiasing"
    if (position < BLUR_RATE) {
      // Blur outer edge
      r *= position / BLUR_RATE;
      g *= position / BLUR_RATE;
      b *= position / BLUR_RATE;
      a *= position / BLUR_RATE;
    } else if (
      position - BORDER_PORTION > 0 &&
      position - BORDER_PORTION < BLUR_RATE
    ) {
      // Blur inner edge
      const t = (position - BORDER_PORTION) / BLUR_RATE;
      const [br, bg, bb, ba] = getColor(BORDER_PORTION);
      r = lerp(t, 0, 1, br, r);
      g = lerp(t, 0, 1, bg, g);
      b = lerp(t, 0, 1, bb, b);
      a = lerp(t, 0, 1, ba, a);
    }

    buffer[i * 4] = r * 255;
    buffer[i * 4 + 1] = g * 255;
    buffer[i * 4 + 2] = b * 255;
    buffer[i * 4 + 3] = a * 255;
  }
  return PIXI.Texture.fromBuffer(buffer, WIDTH, 1);
}

export function loadSliderSprites(
  object: SliderData,
  beatmap: BeatmapData,
  skin: Skin,
  size: number
): SliderSprites {
  const comboColors = beatmap.colors.length > 0 ? beatmap.colors : skin.colors;
  const comboColor = comboColors[object.comboIndex % comboColors.length];

  // Load sprites
  const circleSprite = initCircleSprite(
    skin,
    comboColor,
    object.curve[0],
    size
  );
  const approachSprite = initSprite(
    skin.approach,
    object.curve[0],
    size * APPROACH_R
  );
  const followSprite = initSprite(
    skin.sliderFollowCircle,
    object.curve[0],
    size * FOLLOW_R
  );
  const numberSprites = getNumberSprites(
    skin,
    object.comboNumber,
    object.curve[0],
    size
  );

  approachSprite.tint = comboColor;

  const ballSprite = initSprite(skin.sliderb, object.curve[0]);
  ballSprite.scale.set(size / 128);
  if (skin.allowSliderBallTint) {
    ballSprite.tint = comboColor;
  }

  const tickSprites = object.ticks.map(t => {
    const index = Math.floor(object.curve.length * t);
    const point = object.curve[index];
    return initSprite(skin.sliderScorePoint, point);
  });

  // Reverse arrows
  const reverseSprites = new ReverseArrow(skin.reverseArrow, object, beatmap);

  // Slider mesh
  // TODO: use one shader per skin (generate for all combo colors)
  const shader = new PIXI.MeshMaterial(
    createLegacySliderTexture(skin, comboColor),
    {
      program
    }
  );
  const geometry = new PIXI.Geometry();
  geometry.addAttribute('position', [], 2);
  geometry.addAttribute('tex_position', [], 1);

  const state = new PIXI.State();
  state.depthTest = true;
  state.blend = true;

  const mesh = new CustomMesh(geometry, shader, state);

  // For convenient alpha, visibility, etc.
  const container = new PIXI.Container();
  container.visible = false;
  container.addChild(
    mesh,
    ...tickSprites,
    reverseSprites.start,
    reverseSprites.end,
    circleSprite,
    followSprite,
    numberSprites,
    ballSprite,
    approachSprite
  );

  // Hit object stacking
  const offset = -(object.stackCount * size) / STACK_OFFSET_MULT;
  container.position.set(offset);

  return {
    container,
    mesh,
    circleSprite,
    approachSprite,
    followSprite,
    numberSprites,
    ballSprite,
    tickSprites,
    reverseSprites
  };
}
