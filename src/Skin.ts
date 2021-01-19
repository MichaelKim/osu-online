// @ts-nocheck
import * as PIXI from 'pixi.js';
import { HitResultType } from './HitResultController';
import SampleSetData, { SampleSetType } from './SampleSet';
import { loader, parseKeyValue, readFile, Tuple } from './util';

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
  spinnerTop: 'spinner-top.png'
};

type Resources = Record<keyof typeof assets, PIXI.LoaderResource>;

function loadHitCircle(
  renderer: PIXI.Renderer,
  circleTexture: PIXI.Texture,
  overlayTexture: PIXI.Texture
) {
  const circle = new PIXI.Sprite(circleTexture);
  const overlay = new PIXI.Sprite(overlayTexture);

  const width = Math.max(circle.width, overlay.width);
  const height = Math.max(circle.height, overlay.height);
  circle.position.set(width / 2, height / 2);
  overlay.position.set(width / 2, height / 2);

  const texture = PIXI.RenderTexture.create({ width, height });
  texture.defaultAnchor.set(0.5);

  renderer.render(circle, texture);
  renderer.render(overlay, texture, false);

  return texture;
}

export class Skin {
  // General
  layeredHitSounds: boolean = true;

  // Fonts
  hitCircleOverlap: number = -2;

  // Textures
  cursor: PIXI.Texture;
  // Hit circle
  circle: PIXI.Texture;
  approach: PIXI.Texture;
  followPoint: PIXI.Texture;
  // Numbers
  numbers: Tuple<PIXI.Texture, 10>;
  // Slider
  sliderb: PIXI.Texture;
  sliderFollowCircle: PIXI.Texture;
  sliderScorePoint: PIXI.Texture;
  reverseArrow: PIXI.Texture;
  // Spinner
  spinnerBottom: PIXI.Texture;
  spinnerGlow: PIXI.Texture;
  spinnerMiddle: PIXI.Texture;
  spinnerMiddle2: PIXI.Texture;
  spinnerTop: PIXI.Texture;
  // Hits
  hits: Record<HitResultType, PIXI.Texture>;

  // Sounds
  sampleSets: Record<SampleSetType, SampleSetData>;

  constructor(private filepath: string) {
    this.sampleSets = {
      [SampleSetType.NORMAL]: new SampleSetData('normal'),
      [SampleSetType.SOFT]: new SampleSetData('soft'),
      [SampleSetType.DRUM]: new SampleSetData('drum')
    };
  }

  async parseFile() {
    const file = await readFile(this.filepath);
    let i = 0;
    while (i < file.length) {
      switch (file[i++]) {
        case '[General]': {
          while (i < file.length && file[i][0] !== '[') {
            const [key, value] = parseKeyValue(file[i++]);
            switch (key) {
              case 'LayeredHitSounds': {
                this.layeredHitSounds = parseInt(value) === 1;
                break;
              }
            }
          }
        }
        case '[Fonts]': {
          while (i < file.length && file[i][0] !== '[') {
            const [key, value] = parseKeyValue(file[i++]);
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

  async loadSounds() {
    await this.sampleSets[SampleSetType.NORMAL].load();
    await this.sampleSets[SampleSetType.DRUM].load();
    await this.sampleSets[SampleSetType.SOFT].load();
  }

  async loadTextures(renderer: PIXI.Renderer) {
    for (const [name, url] of Object.entries(assets)) {
      PIXI.Loader.shared.add(name, 'assets/' + url);
    }

    const resources: Partial<Resources> = await loader(
      PIXI.Loader.shared.use(
        (resource: PIXI.LoaderResource, next: () => void) => {
          // Center textures
          resource.texture.defaultAnchor.set(0.5);
          next();
        }
      )
    );

    // TODO: check for missing / error texture
    this.cursor = resources.cursor.texture;
    this.approach = resources.approach.texture;
    this.circle = loadHitCircle(
      renderer,
      resources.circle.texture,
      resources.overlay.texture
    );
    this.followPoint = resources.followPoint.texture;
    this.numbers = [
      resources.default0.texture,
      resources.default1.texture,
      resources.default2.texture,
      resources.default3.texture,
      resources.default4.texture,
      resources.default5.texture,
      resources.default6.texture,
      resources.default7.texture,
      resources.default8.texture,
      resources.default9.texture
    ];
    this.sliderb = resources.sliderb.texture;
    this.sliderFollowCircle = resources.sliderFollowCircle.texture;
    this.sliderScorePoint = resources.sliderScorePoint.texture;
    this.reverseArrow = resources.reverseArrow.texture;
    this.hits = {
      [HitResultType.MISS]: resources.hit0.texture,
      [HitResultType.HIT50]: resources.hit50.texture,
      [HitResultType.HIT100]: resources.hit100.texture,
      [HitResultType.HIT300]: resources.hit300.texture
    };
    this.spinnerBottom = resources.spinnerBottom.texture;
    this.spinnerGlow = resources.spinnerGlow.texture;
    this.spinnerMiddle = resources.spinnerMiddle.texture;
    this.spinnerMiddle2 = resources.spinnerMiddle2.texture;
    this.spinnerTop = resources.spinnerTop.texture;
  }

  async load(renderer: PIXI.Renderer) {
    await Promise.all([
      this.loadTextures(renderer),
      this.loadSounds(),
      this.parseFile()
    ]);
  }
}
