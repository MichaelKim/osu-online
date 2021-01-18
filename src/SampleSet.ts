import * as PIXI from 'pixi.js';
import {
  BaseHitSound,
  HitSoundType,
  SliderHitSound
} from './HitSoundController';
import { loader, Tuple } from './util';

export enum SampleSetType {
  NORMAL = 1,
  SOFT = 2,
  DRUM = 3
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

export function parseHitSample(line: string): Tuple<SampleSetType, 2> {
  // TODO: normalSet:additionSet:index:volume:filename
  const sampleTokens = line.split(':');
  return [parseInt(sampleTokens[0]), parseInt(sampleTokens[1])];
}

type SoundResources = Partial<
  Record<keyof typeof soundAssets, PIXI.LoaderResource>
>;

export default class SampleSetData {
  private loader: PIXI.Loader = new PIXI.Loader();

  sounds: Partial<Record<HitSoundType, PIXI.sound.Sound>> = {};

  constructor(private name: string) {}

  async load() {
    for (const [name, url] of Object.entries(soundAssets)) {
      this.loader.add(name, `assets/audio/${this.name}-${url}.wav`);
    }

    const resources: SoundResources = await loader(this.loader);
    this.sounds[BaseHitSound.CLAP] = resources['hitClap']?.sound;
    this.sounds[BaseHitSound.FINISH] = resources['hitFinish']?.sound;
    this.sounds[BaseHitSound.NORMAL] = resources['hitNormal']?.sound;
    this.sounds[BaseHitSound.WHISTLE] = resources['hitWhistle']?.sound;
    this.sounds[SliderHitSound.SLIDER_SLIDE] = resources['sliderSlide']?.sound;
    this.sounds[SliderHitSound.SLIDER_TICK] = resources['sliderTick']?.sound;
    this.sounds[SliderHitSound.SLIDER_WHISTLE] =
      resources['sliderWhistle']?.sound;
  }
}
