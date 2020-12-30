import SampleSetData, { SampleSetType } from './SampleSet';
import { Skin } from './Skin';

export enum BaseHitSound {
  NORMAL = 1 << 0,
  WHISTLE = 1 << 1,
  FINISH = 1 << 2,
  CLAP = 1 << 3
}

export enum SliderHitSound {
  SLIDER_SLIDE = 10,
  SLIDER_TICK,
  SLIDER_WHISTLE
}

export type HitSoundType = BaseHitSound | SliderHitSound;

// Object pool for specific hit sound
class HitSound {
  audio: HTMLAudioElement[];

  constructor(audio: HTMLAudioElement) {
    this.audio = [audio];
  }

  play() {
    let i = 0;
    while (i < this.audio.length && !this.audio[i].paused) i++;
    if (i === this.audio.length)
      this.audio.push(this.audio[0].cloneNode(true) as HTMLAudioElement);
    this.audio[i].play();
  }
}

function initData(data: SampleSetData) {
  return {
    [BaseHitSound.NORMAL]: new HitSound(data.hitNormal),
    [BaseHitSound.WHISTLE]: new HitSound(data.hitWhistle),
    [BaseHitSound.FINISH]: new HitSound(data.hitFinish),
    [BaseHitSound.CLAP]: new HitSound(data.hitClap),
    [SliderHitSound.SLIDER_SLIDE]: new HitSound(data.sliderSlide),
    [SliderHitSound.SLIDER_TICK]: new HitSound(data.sliderTick),
    [SliderHitSound.SLIDER_WHISTLE]: new HitSound(data.sliderWhistle)
  };
}

export default class HitSoundController {
  skin: Skin;
  sounds: Record<SampleSetType, Record<HitSoundType, HitSound>>;

  constructor(skin: Skin) {
    this.skin = skin;
    this.sounds = {
      [SampleSetType.NORMAL]: initData(skin.sampleSets[SampleSetType.NORMAL]),
      [SampleSetType.SOFT]: initData(skin.sampleSets[SampleSetType.SOFT]),
      [SampleSetType.DRUM]: initData(skin.sampleSets[SampleSetType.DRUM])
    };
  }

  playBaseSound(sampleSet: SampleSetType, hitSound: BaseHitSound) {
    if (hitSound & BaseHitSound.NORMAL) {
      this.playSound(sampleSet, BaseHitSound.NORMAL);
    }
    if (hitSound & BaseHitSound.WHISTLE) {
      this.playSound(sampleSet, BaseHitSound.WHISTLE);
    }
    if (hitSound & BaseHitSound.FINISH) {
      this.playSound(sampleSet, BaseHitSound.FINISH);
    }
    if (hitSound & BaseHitSound.CLAP) {
      this.playSound(sampleSet, BaseHitSound.CLAP);
    }
  }

  playSound(sampleSet: SampleSetType, hitSound: HitSoundType) {
    if (sampleSet === SampleSetType.NORMAL || this.skin.layeredHitSounds) {
      this.sounds[SampleSetType.NORMAL][hitSound].play();
    }

    if (sampleSet !== SampleSetType.NORMAL) {
      this.sounds[sampleSet][hitSound].play();
    }
  }
}
