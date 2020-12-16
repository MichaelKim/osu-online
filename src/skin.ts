import * as PIXI from 'pixi.js';
import { AudioResource } from './AudioLoader';
import { Tuple } from './util';

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
  sliderFollowCircle: 'sliderfollowcircle.png'
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

const soundAssets = {
  hitClap: 'hitclap',
  hitFinish: 'hitfinish',
  hitNormal: 'hitnormal',
  hitWhistle: 'hitwhistle',
  sliderSlide: 'sliderslide',
  sliderTick: 'slidertick',
  sliderWhistle: 'sliderwhistle'
};
type SoundResources = Record<keyof typeof soundAssets, AudioResource>;

function parseKeyValue(line: string) {
  const split = line.indexOf(':');
  const key = line.slice(0, split).trim();
  const value = line.slice(split + 1).trim();
  return [key, value];
}

class SampleSet {
  name: string;
  loader: PIXI.Loader;

  hitClap: HTMLAudioElement;
  hitFinish: HTMLAudioElement;
  hitNormal: HTMLAudioElement;
  hitWhistle: HTMLAudioElement;
  sliderSlide: HTMLAudioElement;
  sliderTick: HTMLAudioElement;
  sliderWhistle: HTMLAudioElement;

  constructor(name: string, loader: PIXI.Loader) {
    this.name = name;
    this.loader = loader;
  }

  async load() {
    return new Promise<void>(resolve => {
      const paths = Object.entries(soundAssets).map(([name, url]) => ({
        name: this.name + name,
        url: `assets/audio/${this.name}-${url}.wav`
      }));
      this.loader.add(paths).load((_, resources: SoundResources) => {
        // TODO: check for missing / error sounds
        this.hitClap = resources[this.name + 'hitClap'].data;
        this.hitFinish = resources[this.name + 'hitFinish'].data;
        this.hitNormal = resources[this.name + 'hitNormal'].data;
        this.hitWhistle = resources[this.name + 'hitWhistle'].data;
        this.sliderSlide = resources[this.name + 'sliderSlide'].data;
        this.sliderTick = resources[this.name + 'sliderTick'].data;
        this.sliderWhistle = resources[this.name + 'sliderWhistle'].data;
        resolve();
      });
    });
  }
}

export class Skin {
  filepath: string;
  // Fonts
  hitCircleOverlap: number = -2;

  // Textures
  cursor: PIXI.Texture;
  // Hit circle
  circle: PIXI.Texture;
  approach: PIXI.Texture;
  // Numbers
  numbers: Tuple<PIXI.Texture, 10>;

  // Slider
  sliderb: PIXI.Texture;
  sliderFollowCircle: PIXI.Texture;

  // Sounds
  soundLoader: PIXI.Loader;
  sounds: {
    drum: SampleSet;
    normal: SampleSet;
    soft: SampleSet;
  };

  constructor(filepath: string) {
    this.filepath = filepath;

    this.soundLoader = new PIXI.Loader();
    this.sounds = {
      drum: new SampleSet('drum', this.soundLoader),
      normal: new SampleSet('normal', this.soundLoader),
      soft: new SampleSet('soft', this.soundLoader)
    };
  }

  async parseFile() {
    const res = await fetch(this.filepath);
    const text = await res.text();

    const file = text.split('\n').map(l => l.trim());
    let i = 0;
    while (i < file.length) {
      switch (file[i++]) {
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
    await this.sounds.drum.load();
    await this.sounds.normal.load();
    await this.sounds.soft.load();
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

        // Center textures
        this.cursor.defaultAnchor.set(0.5);
        this.approach.defaultAnchor.set(0.5);
        this.numbers.forEach(n => n.defaultAnchor.set(0.5));
        this.sliderb.defaultAnchor.set(0.5);
        this.sliderFollowCircle.defaultAnchor.set(0.5);

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
