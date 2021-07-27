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
import assets from './textures.json';

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
  cursor: Texture = Texture.EMPTY;
  // Hit circle
  circle: Texture = Texture.EMPTY;
  overlay: Texture = Texture.EMPTY;
  approach: Texture = Texture.EMPTY;
  followPoint: Texture = Texture.EMPTY;
  // Numbers
  numbers: Tuple<Texture, 10> = [
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY
  ];
  scores: Tuple<Texture, 10> = [
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY,
    Texture.EMPTY
  ];
  scoreComma: Texture = Texture.EMPTY;
  scoreDot: Texture = Texture.EMPTY;
  scorePercent: Texture = Texture.EMPTY;
  scoreX: Texture = Texture.EMPTY;
  // Slider
  sliderb: Texture = Texture.EMPTY;
  sliderFollowCircle: Texture = Texture.EMPTY;
  sliderScorePoint: Texture = Texture.EMPTY;
  reverseArrow: Texture = Texture.EMPTY;
  // Spinner
  spinnerBottom: Texture = Texture.EMPTY;
  spinnerGlow: Texture = Texture.EMPTY;
  spinnerMiddle: Texture = Texture.EMPTY;
  spinnerMiddle2: Texture = Texture.EMPTY;
  spinnerTop: Texture = Texture.EMPTY;
  // Hits
  hits: Record<HitCircleHitResultType, Texture> = {
    [HitResultType.MISS]: Texture.EMPTY,
    [HitResultType.HIT50]: Texture.EMPTY,
    [HitResultType.HIT100]: Texture.EMPTY,
    [HitResultType.HIT300]: Texture.EMPTY
  };

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
    this.cursor = resources.cursor?.texture ?? Texture.EMPTY;
    this.approach = resources.approach?.texture ?? Texture.EMPTY;
    this.circle = resources.circle?.texture ?? Texture.EMPTY;
    this.overlay = resources.overlay?.texture ?? Texture.EMPTY;
    this.followPoint = resources.followPoint?.texture ?? Texture.EMPTY;
    this.numbers = [
      resources.default0?.texture ?? Texture.EMPTY,
      resources.default1?.texture ?? Texture.EMPTY,
      resources.default2?.texture ?? Texture.EMPTY,
      resources.default3?.texture ?? Texture.EMPTY,
      resources.default4?.texture ?? Texture.EMPTY,
      resources.default5?.texture ?? Texture.EMPTY,
      resources.default6?.texture ?? Texture.EMPTY,
      resources.default7?.texture ?? Texture.EMPTY,
      resources.default8?.texture ?? Texture.EMPTY,
      resources.default9?.texture ?? Texture.EMPTY
    ];
    this.sliderb = resources.sliderb?.texture ?? Texture.EMPTY;
    this.sliderFollowCircle =
      resources.sliderFollowCircle?.texture ?? Texture.EMPTY;
    this.sliderScorePoint =
      resources.sliderScorePoint?.texture ?? Texture.EMPTY;
    this.reverseArrow = resources.reverseArrow?.texture ?? Texture.EMPTY;
    this.hits = {
      [HitResultType.MISS]: resources.hit0?.texture ?? Texture.EMPTY,
      [HitResultType.HIT50]: resources.hit50?.texture ?? Texture.EMPTY,
      [HitResultType.HIT100]: resources.hit100?.texture ?? Texture.EMPTY,
      [HitResultType.HIT300]: resources.hit300?.texture ?? Texture.EMPTY
    };
    this.spinnerBottom = resources.spinnerBottom?.texture ?? Texture.EMPTY;
    this.spinnerGlow = resources.spinnerGlow?.texture ?? Texture.EMPTY;
    this.spinnerMiddle = resources.spinnerMiddle?.texture ?? Texture.EMPTY;
    this.spinnerMiddle2 = resources.spinnerMiddle2?.texture ?? Texture.EMPTY;
    this.spinnerTop = resources.spinnerTop?.texture ?? Texture.EMPTY;

    this.scores = [
      resources.score0?.texture ?? Texture.EMPTY,
      resources.score1?.texture ?? Texture.EMPTY,
      resources.score2?.texture ?? Texture.EMPTY,
      resources.score3?.texture ?? Texture.EMPTY,
      resources.score4?.texture ?? Texture.EMPTY,
      resources.score5?.texture ?? Texture.EMPTY,
      resources.score6?.texture ?? Texture.EMPTY,
      resources.score7?.texture ?? Texture.EMPTY,
      resources.score8?.texture ?? Texture.EMPTY,
      resources.score9?.texture ?? Texture.EMPTY
    ];
    this.scoreComma = resources.scoreComma?.texture ?? Texture.EMPTY;
    this.scoreDot = resources.scoreDot?.texture ?? Texture.EMPTY;
    this.scoreX = resources.scoreX?.texture ?? Texture.EMPTY;
    this.scorePercent = resources.scorePercent?.texture ?? Texture.EMPTY;
  }

  async load() {
    await Promise.all([
      this.loadTextures(),
      this.loadSounds(),
      this.parseFile()
    ]);
  }
}
