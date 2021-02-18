import { SliderData } from './Loader/SliderLoader';
import { SampleSetType } from './SampleSet';
import Skin from './Skin';

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

export default class HitSoundController {
  constructor(private skin: Skin) {}

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

  playSliderEdge(slider: SliderData, index: number) {
    const hitSound = slider.edgeSounds[index] || slider.hitSound;
    // [normal, addition]
    const setIndex = hitSound === BaseHitSound.NORMAL ? 0 : 1;
    const sampleSet = slider.edgeSets[index]?.[setIndex] || slider.sampleSet;
    this.playBaseSound(sampleSet, hitSound);
  }

  playSound(sampleSet: SampleSetType, hitSound: HitSoundType) {
    if (sampleSet === SampleSetType.NORMAL || this.skin.layeredHitSounds) {
      this.skin.sampleSets[SampleSetType.NORMAL].sounds[hitSound]?.play();
    }

    if (sampleSet !== SampleSetType.NORMAL) {
      this.skin.sampleSets[sampleSet].sounds[hitSound]?.play();
    }
  }
}
