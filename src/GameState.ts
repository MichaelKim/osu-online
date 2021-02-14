import Beatmap from './Beatmap';
import HitCircle from './HitObjects/HitCircle';
import Slider from './HitObjects/Slider';
import HitResultController, { HitResultType } from './HitResultController';
import HitSoundController, {
  BaseHitSound,
  SliderHitSound
} from './HitSoundController';
import ComboDisplay from './HUD/ComboDisplay';
import Renderer from './Renderer';
import Skin from './Skin';
import { csToSize } from './timing';

export default class GameState {
  score: number = 0;
  combo: number = 0;
  hitResult: HitResultController;
  hitSound: HitSoundController;
  comboDisplay: ComboDisplay;

  constructor(renderer: Renderer, skin: Skin) {
    this.hitResult = new HitResultController(renderer.hitResultStage, skin);
    this.hitSound = new HitSoundController(skin);
    this.comboDisplay = new ComboDisplay(renderer.displayStage, skin);
  }

  load(beatmap: Beatmap) {
    this.hitResult.loadDiameter(csToSize(beatmap.data.cs));
  }

  addResult(type: HitResultType, object: HitCircle, time: number) {
    if (type !== HitResultType.MISS) {
      this.setCombo(this.combo + 1, time);
      this.hitSound.playBaseSound(object.o.sampleSet, object.o.hitSound);
    } else {
      this.setCombo(0, time);
    }
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderHead(type: HitResultType, object: Slider, time: number) {
    if (type !== HitResultType.MISS) {
      this.addSliderEdge(object, time, 0);
    } else {
      this.setCombo(0, time);
    }
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderTick(object: Slider, time: number) {
    this.setCombo(this.combo + 1, time);

    this.hitSound.playSound(object.o.sampleSet, SliderHitSound.SLIDER_TICK);
  }

  addSliderEdge(object: Slider, time: number, index: number) {
    const hitSound = object.o.edgeSounds[index] || object.o.hitSound;
    // [normal, addition]
    const setIndex = hitSound === BaseHitSound.NORMAL ? 0 : 1;
    const sampleSet =
      object.o.edgeSets[index]?.[setIndex] || object.o.sampleSet;
    this.hitSound.playBaseSound(sampleSet, hitSound);

    // LAZER: slider ends don't add to combo
    if (index !== object.o.edgeSounds.length - 1) {
      this.setCombo(this.combo + 1, time);
    }
  }

  private setCombo(combo: number, time: number) {
    this.combo = combo;
    this.comboDisplay.setCombo(this.combo, time);
  }

  update(time: number) {
    this.hitResult.update(time);
    this.comboDisplay.update(time);
  }
}
