import * as PIXI from 'pixi.js';
import { HitResultType } from './HitResultController';
import SampleSetData, { SampleSetType } from './SampleSet';
import { parseKeyValue, readFile, Tuple } from './util';

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
  followPoint: 'followpoint.png'
};

type Resources = Record<keyof typeof assets, PIXI.LoaderResource>;

function loadHitCircle(
  renderer: PIXI.Renderer,
  circleTexture: PIXI.Texture,
  overlayTexture: PIXI.Texture
) {
  const circle = new PIXI.Sprite(circleTexture);
  const overlay = new PIXI.Sprite(overlayTexture);
  circle.anchor.set(0.5);
  overlay.anchor.set(0.5);

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
  filepath: string;

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

  // Hits
  hits: Record<HitResultType, PIXI.Texture>;

  // Sounds
  soundLoader: PIXI.Loader;
  sampleSets: Record<SampleSetType, SampleSetData>;

  constructor(filepath: string) {
    this.filepath = filepath;

    this.soundLoader = new PIXI.Loader();
    this.sampleSets = {
      [SampleSetType.NORMAL]: new SampleSetData('normal', this.soundLoader),
      [SampleSetType.SOFT]: new SampleSetData('soft', this.soundLoader),
      [SampleSetType.DRUM]: new SampleSetData('drum', this.soundLoader)
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

  loadTextures(renderer: PIXI.Renderer) {
    const paths = Object.entries(assets).map(([name, url]) => ({
      name,
      url: 'assets/' + url
    }));

    return new Promise<void>(resolve => {
      PIXI.Loader.shared.add(paths).load((_, resources: Partial<Resources>) => {
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

        // Center textures
        this.cursor.defaultAnchor.set(0.5);
        this.approach.defaultAnchor.set(0.5);
        this.followPoint.defaultAnchor.set(0.5);
        this.numbers.forEach(n => n.defaultAnchor.set(0.5));
        this.sliderb.defaultAnchor.set(0.5);
        this.sliderFollowCircle.defaultAnchor.set(0.5);
        this.sliderScorePoint.defaultAnchor.set(0.5);
        this.reverseArrow.defaultAnchor.set(0.5);
        this.hits[HitResultType.MISS].defaultAnchor.set(0.5);
        this.hits[HitResultType.HIT50].defaultAnchor.set(0.5);
        this.hits[HitResultType.HIT100].defaultAnchor.set(0.5);
        this.hits[HitResultType.HIT300].defaultAnchor.set(0.5);

        resolve();
      });
    });
  }

  async load(renderer: PIXI.Renderer) {
    await Promise.all([
      this.loadTextures(renderer),
      this.loadSounds(),
      this.parseFile()
    ]);
  }
}
