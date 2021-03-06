import { Texture } from '@pixi/core';
import { Loader } from '@pixi/loaders';
import { HitCircleHitResultType, HitResultType } from './HitResultController';
import SampleSetData, { SampleSetType } from './SampleSet';
import {
  getSections,
  loader,
  LoaderResource,
  parseColor,
  parseKeyValue,
  readFile,
  Tuple
} from './util';

// Filepaths to each asset
const assets = {
  cursor: 'cursor.png',
  circle: 'hitcircle.png',
  overlay: 'hitcircleoverlay.png',
  approach: 'approachcircle.png',
  default0: 'default-0.png',
  default1: 'default-1.png',
  default2: 'default-2.png',
  default3: 'default-3.png',
  default4: 'default-4.png',
  default5: 'default-5.png',
  default6: 'default-6.png',
  default7: 'default-7.png',
  default8: 'default-8.png',
  default9: 'default-9.png',
  sliderb: 'sliderb.png',
  sliderFollowCircle: 'sliderfollowcircle.png',
  sliderScorePoint: 'sliderscorepoint.png',
  reverseArrow: 'reversearrow.png',
  hit0: 'hit0.png',
  hit50: 'hit50.png',
  hit100: 'hit100.png',
  hit300: 'hit300.png',
  followPoint: 'followpoint.png',
  spinnerBottom: 'spinner-bottom.png',
  spinnerGlow: 'spinner-glow.png',
  spinnerMiddle: 'spinner-middle.png',
  spinnerMiddle2: 'spinner-middle2.png',
  spinnerTop: 'spinner-top.png',
  score0: 'score-0.png',
  score1: 'score-1.png',
  score2: 'score-2.png',
  score3: 'score-3.png',
  score4: 'score-4.png',
  score5: 'score-5.png',
  score6: 'score-6.png',
  score7: 'score-7.png',
  score8: 'score-8.png',
  score9: 'score-9.png',
  scoreComma: 'score-comma.png',
  scoreDot: 'score-dot.png',
  scorePercent: 'score-percent.png',
  scoreX: 'score-x.png'
};

export default class Skin {
  // [General]
  allowSliderBallTint = false;
  layeredHitSounds = true;

  // [Colours]
  colors: number[] = [
    // LAZER: "Combo1" is the last combo color
    parseColor('255,192,0'),
    parseColor('0,202,0'),
    parseColor('18,124,255'),
    parseColor('242,24,57')
  ];
  sliderBorder: number = parseColor('255,255,255');
  sliderTrackOverride?: number;

  // [Fonts]
  hitCircleOverlap = -2;

  // Textures
  cursor?: Texture;
  // Hit circle
  circle?: Texture;
  overlay?: Texture;
  approach?: Texture;
  followPoint?: Texture;
  // Numbers
  numbers: Partial<Tuple<Texture, 10>> = [];
  scores: Partial<Tuple<Texture, 10>> = [];
  scoreComma?: Texture;
  scoreDot?: Texture;
  scorePercent?: Texture;
  scoreX?: Texture;
  // Slider
  sliderb?: Texture;
  sliderFollowCircle?: Texture;
  sliderScorePoint?: Texture;
  reverseArrow?: Texture;
  // Spinner
  spinnerBottom?: Texture;
  spinnerGlow?: Texture;
  spinnerMiddle?: Texture;
  spinnerMiddle2?: Texture;
  spinnerTop?: Texture;
  // Hits
  hits: Partial<Record<HitCircleHitResultType, Texture>> = {};

  // Sounds
  sampleSets: Record<SampleSetType, SampleSetData> = {
    [SampleSetType.NORMAL]: new SampleSetData('normal'),
    [SampleSetType.SOFT]: new SampleSetData('soft'),
    [SampleSetType.DRUM]: new SampleSetData('drum')
  };

  constructor(private filepath: string) {}

  private async parseFile() {
    const file = await readFile(this.filepath);

    for (const [name, section] of getSections(file)) {
      switch (name) {
        case '[General]': {
          for (const line of section) {
            const [key, value] = parseKeyValue(line);
            switch (key) {
              case 'AllowSliderBallTint': {
                this.allowSliderBallTint = parseInt(value) === 1;
                break;
              }
              case 'LayeredHitSounds': {
                this.layeredHitSounds = parseInt(value) === 1;
                break;
              }
            }
          }
          break;
        }
        case '[Colours]': {
          const skinColours = [];
          for (const line of section) {
            const [key, value] = parseKeyValue(line);
            switch (key) {
              case 'Combo1':
              case 'Combo2':
              case 'Combo3':
              case 'Combo4':
              case 'Combo5':
              case 'Combo6':
              case 'Combo7':
              case 'Combo8':
                skinColours.push(parseColor(value));
                break;
              case 'SliderBorder':
                this.sliderBorder = parseColor(value);
                break;
              case 'SliderTrackOverride':
                this.sliderTrackOverride = parseColor(value);
                break;
            }
          }
          if (skinColours.length > 0) {
            // Override default
            this.colors = skinColours;
          }
          break;
        }
        case '[Fonts]': {
          for (const line of section) {
            const [key, value] = parseKeyValue(line);
            switch (key) {
              case 'HitCircleOverlap': {
                this.hitCircleOverlap = parseInt(value);
                break;
              }
            }
          }
          break;
        }
      }
    }
  }

  private async loadSounds() {
    await this.sampleSets[SampleSetType.NORMAL].load();
    await this.sampleSets[SampleSetType.DRUM].load();
    await this.sampleSets[SampleSetType.SOFT].load();
  }

  private async loadTextures() {
    for (const [name, url] of Object.entries(assets)) {
      Loader.shared.add(name, 'assets/' + url);
    }

    const resources = await loader<keyof typeof assets>(
      Loader.shared.use((resource: LoaderResource, next: () => void) => {
        // Center textures
        resource.texture?.defaultAnchor.set(0.5);
        next();
      })
    );

    // TODO: check for missing / error texture
    this.cursor = resources.cursor?.texture;
    this.approach = resources.approach?.texture;
    this.circle = resources.circle?.texture;
    this.overlay = resources.overlay?.texture;
    this.followPoint = resources.followPoint?.texture;
    this.numbers = [
      resources.default0?.texture,
      resources.default1?.texture,
      resources.default2?.texture,
      resources.default3?.texture,
      resources.default4?.texture,
      resources.default5?.texture,
      resources.default6?.texture,
      resources.default7?.texture,
      resources.default8?.texture,
      resources.default9?.texture
    ];
    this.sliderb = resources.sliderb?.texture;
    this.sliderFollowCircle = resources.sliderFollowCircle?.texture;
    this.sliderScorePoint = resources.sliderScorePoint?.texture;
    this.reverseArrow = resources.reverseArrow?.texture;
    this.hits = {
      [HitResultType.MISS]: resources.hit0?.texture,
      [HitResultType.HIT50]: resources.hit50?.texture,
      [HitResultType.HIT100]: resources.hit100?.texture,
      [HitResultType.HIT300]: resources.hit300?.texture
    };
    this.spinnerBottom = resources.spinnerBottom?.texture;
    this.spinnerGlow = resources.spinnerGlow?.texture;
    this.spinnerMiddle = resources.spinnerMiddle?.texture;
    this.spinnerMiddle2 = resources.spinnerMiddle2?.texture;
    this.spinnerTop = resources.spinnerTop?.texture;

    this.scores = [
      resources.score0?.texture,
      resources.score1?.texture,
      resources.score2?.texture,
      resources.score3?.texture,
      resources.score4?.texture,
      resources.score5?.texture,
      resources.score6?.texture,
      resources.score7?.texture,
      resources.score8?.texture,
      resources.score9?.texture
    ];
    this.scoreComma = resources.scoreComma?.texture;
    this.scoreDot = resources.scoreDot?.texture;
    this.scoreX = resources.scoreX?.texture;
    this.scorePercent = resources.scorePercent?.texture;
  }

  async load() {
    await Promise.all([
      this.loadTextures(),
      this.loadSounds(),
      this.parseFile()
    ]);
  }
}
