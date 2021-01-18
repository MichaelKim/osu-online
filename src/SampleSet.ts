// @ts-nocheck
import * as PIXI from 'pixi.js';
import { AudioResource } from './AudioLoader';
import { Tuple } from './util';

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

type SoundResources = Record<keyof typeof soundAssets, AudioResource>;

export default class SampleSetData {
  private loader: PIXI.Loader;

  hitClap: HTMLAudioElement;
  hitFinish: HTMLAudioElement;
  hitNormal: HTMLAudioElement;
  hitWhistle: HTMLAudioElement;
  sliderSlide: HTMLAudioElement;
  sliderTick: HTMLAudioElement;
  sliderWhistle: HTMLAudioElement;

  constructor(private name: string) {
    this.loader = new PIXI.Loader();
  }

  async load() {
    return new Promise<void>(resolve => {
      const paths = Object.entries(soundAssets).map(([name, url]) => ({
        name,
        url: `assets/audio/${this.name}-${url}.wav`
      }));
      this.loader.add(paths).load((_, resources: Partial<SoundResources>) => {
        // TODO: check for missing / error sounds
        this.hitClap = resources['hitClap'].data;
        this.hitFinish = resources['hitFinish'].data;
        this.hitNormal = resources['hitNormal'].data;
        this.hitWhistle = resources['hitWhistle'].data;
        this.sliderSlide = resources['sliderSlide'].data;
        this.sliderTick = resources['sliderTick'].data;
        this.sliderWhistle = resources['sliderWhistle'].data;
        resolve();
      });
    });
  }
}
