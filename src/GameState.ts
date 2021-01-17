import Beatmap from './Beatmap';
import HitCircle from './HitObjects/HitCircle';
import Slider from './HitObjects/Slider';
import HitResultController, { HitResultType } from './HitResultController';
import HitSoundController, {
  BaseHitSound,
  SliderHitSound
} from './HitSoundController';
import Renderer from './Renderer';
import { Skin } from './Skin';
import { csToSize } from './timing';

export default class GameState {
  score: number = 0;
  hitResult: HitResultController;
  hitSound: HitSoundController;

  constructor(renderer: Renderer, skin: Skin) {
    this.hitResult = new HitResultController(renderer.hitResultStage, skin);
    this.hitSound = new HitSoundController(skin);
  }

  load(beatmap: Beatmap) {
    this.hitResult.loadDiameter(csToSize(beatmap.data.cs));
  }

  addResult(type: HitResultType, object: HitCircle | Slider, time: number) {
    if (type !== HitResultType.MISS) {
      this.hitSound.playBaseSound(object.o.sampleSet, object.o.hitSound);
    }
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderHead(type: HitResultType, object: Slider, time: number) {
    if (type !== HitResultType.MISS) {
      this.addSliderEdge(object, time, 0);
    }
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderTick(object: Slider, time: number) {
    this.hitSound.playSound(object.o.sampleSet, SliderHitSound.SLIDER_TICK);
  }

  addSliderEdge(object: Slider, time: number, index: number) {
    const hitSound = object.o.edgeSounds[index] || object.o.hitSound;
    // [normal, addition]
    const setIndex = hitSound === BaseHitSound.NORMAL ? 0 : 1;
    const sampleSet =
      object.o.edgeSets[index]?.[setIndex] || object.o.sampleSet;
    this.hitSound.playBaseSound(sampleSet, hitSound);
  }

  update(time: number) {
    this.hitResult.update(time);
  }
}
