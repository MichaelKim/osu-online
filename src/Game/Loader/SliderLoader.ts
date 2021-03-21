import { Geometry, Program, Renderer, State, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { Mesh, MeshMaterial } from '@pixi/mesh';
import { Sprite } from '@pixi/sprite';
import { hex2rgb } from '@pixi/utils';
import { CurveTypes, getSliderCurve, Line } from '../Curve';
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
import SliderTick from '../Sprites/SliderTick';
import { csToSize } from '../timing';
import { clamp, clerp01, lerp, Tuple } from '../util';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

type EdgeSet = Tuple<SampleSetType, 2>; // [normal, addition]

export interface SliderData {
  type: HitObjectTypes.SLIDER;

  // Metadata
  points: Point[]; // Control points
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
  lines: Line[];
  size: number;
  tickDist: number;
}

export interface SliderSprites {
  container: Container;
  mesh: Mesh;
  tickSprites: SliderTick[];
  circleSprite: Container;
  approachSprite: Sprite;
  numberSprites: Container;
  ballSprite: Sprite;
  followSprite: Sprite;
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
  const points = [{ x, y }, ...otherPoints].map(({ x, y }) => new Point(x, y));

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

  const hitSample = tokens.length > 10 ? parseHitSample(tokens[10]) : [0, 0];
  const sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
  const additionSet = hitSample[1] || hitSample[0];

  // Calculate slider duration
  const sliderTime =
    (timingPoint.beatLength * length) / (100 * beatmap.sliderMultiplier);

  // Hit circle diameter
  const size = csToSize(beatmap.cs);

  // Commonly computed value
  const endTime = t + sliderTime * slides;

  // Calculate curve points
  const lines = getSliderCurve(sliderType, points, length, size);

  // Calculate slider ticks
  const tickDist =
    (100 * beatmap.sliderMultiplier) /
    beatmap.sliderTickRate /
    timingPoint.mult;

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
    lines,
    size,
    tickDist
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

const program = Program.from(vertexSrc, fragmentSrc);

// Custom mesh that clears the depth buffer before drawing
class CustomMesh extends Mesh {
  protected _render(renderer: Renderer): void {
    // TODO: batching?
    this._renderDefault(renderer);
  }

  protected _renderDefault(renderer: Renderer): void {
    const shader = this.shader;

    shader.alpha = this.worldAlpha;
    shader.update?.();

    renderer.batch.flush();
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
  const [borderR, borderG, borderB] = hex2rgb(borderColor);
  const trackColor = skin.sliderTrackOverride ?? color;
  const [trackR, trackG, trackB] = hex2rgb(trackColor);

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
  return Texture.fromBuffer(buffer, WIDTH, 1);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [borderR, borderG, borderB] = hex2rgb(borderColor);
  const trackColor = skin.sliderTrackOverride ?? color;
  const [trackR, trackG, trackB] = hex2rgb(trackColor);

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
  return Texture.fromBuffer(buffer, WIDTH, 1);
}

export function loadSliderSprites(
  object: SliderData,
  beatmap: BeatmapData,
  skin: Skin
): SliderSprites {
  const comboColors = beatmap.colors.length > 0 ? beatmap.colors : skin.colors;
  const comboColor = comboColors[object.comboIndex % comboColors.length];

  const start = object.lines[0].start;

  // Load sprites
  const circleSprite = initCircleSprite(skin, comboColor, start, object.size);
  const approachSprite = initSprite(
    skin.approach,
    start,
    object.size * APPROACH_R
  );
  const followSprite = initSprite(
    skin.sliderFollowCircle,
    start,
    object.size * FOLLOW_R
  );
  const numberSprites = getNumberSprites(
    skin,
    object.comboNumber,
    start,
    object.size
  );

  approachSprite.tint = comboColor;

  const ballSprite = initSprite(skin.sliderb, start);
  ballSprite.scale.set(object.size / 128);
  if (skin.allowSliderBallTint) {
    ballSprite.tint = comboColor;
  }

  // Slider ticks
  const tickSprites: SliderTick[] = [];
  const velocity = object.length / object.sliderTime;
  for (let slideIndex = 0; slideIndex < object.slides; slideIndex++) {
    for (
      let d = object.tickDist;
      d < object.length - velocity * 10;
      d += object.tickDist
    ) {
      const t = d / object.length;
      tickSprites.push(
        new SliderTick(skin.sliderScorePoint, object, t, slideIndex)
      );
    }
  }

  // Reverse arrows
  const reverseSprites = new ReverseArrow(skin.reverseArrow, object, beatmap);

  // Slider mesh
  // TODO: use one shader per skin (generate for all combo colors)
  const shader = new MeshMaterial(createLegacySliderTexture(skin, comboColor), {
    program
  });
  const geometry = new Geometry();
  geometry.addAttribute('position', [], 2);
  geometry.addAttribute('tex_position', [], 1);
  geometry.addIndex([]);

  const state = new State();
  state.depthTest = true;
  state.blend = true;

  const mesh = new CustomMesh(geometry, shader, state);

  // For convenient alpha, visibility, etc.
  const container = new Container();
  container.visible = false;
  container.addChild(
    mesh,
    ...tickSprites.map(t => t.sprite),
    reverseSprites.start,
    reverseSprites.end,
    circleSprite,
    followSprite,
    numberSprites,
    ballSprite,
    approachSprite
  );

  // Hit object stacking
  const offset = -(object.stackCount * object.size) / STACK_OFFSET_MULT;
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
