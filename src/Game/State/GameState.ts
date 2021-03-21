import Beatmap from '../Beatmap';
import HitCircle from '../HitObjects/HitCircle';
import Slider from '../HitObjects/Slider';
import Spinner from '../HitObjects/Spinner';
import HitResultController, {
  HitCircleHitResultType,
  HitResultType
} from '../HitResultController';
import HitSoundController, { SliderHitSound } from '../HitSoundController';
import Renderer from '../Renderer';
import Skin from '../Skin';
import { csToSize } from '../timing';
import ScoreState from './ScoreState';

export default class GameState {
  hitResult: HitResultController;
  hitSound: HitSoundController;
  scoreState: ScoreState;

  constructor(renderer: Renderer, skin: Skin) {
    this.hitResult = new HitResultController(renderer.hitResultStage, skin);
    this.hitSound = new HitSoundController(skin);
    this.scoreState = new ScoreState(renderer, skin);
  }

  load(beatmap: Beatmap) {
    this.hitResult.loadDiameter(csToSize(beatmap.data.cs));
    this.scoreState.load(beatmap.notes);
  }

  restart() {
    this.scoreState.restart();
  }

  reset() {
    this.hitResult.reset();
    this.scoreState.reset();
  }

  getState() {
    return this.scoreState.getState();
  }

  addResult(
    type: HitCircleHitResultType,
    object: HitCircle | Spinner,
    time: number
  ) {
    if (type !== HitResultType.MISS) {
      this.hitSound.playBaseSound(object.o.sampleSet, object.o.hitSound);
    }

    this.scoreState.addResult(type, time);
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderHead(type: HitCircleHitResultType, object: Slider, time: number) {
    if (type !== HitResultType.MISS) {
      this.hitSound.playSliderEdge(object.o, 0);
    }

    this.scoreState.addResult(type, time);
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderTick(object: Slider, time: number) {
    this.hitSound.playSound(object.o.sampleSet, SliderHitSound.SLIDER_TICK);
    this.scoreState.addResult(HitResultType.TICK_HIT, time);
  }

  missSliderTick(object: Slider, time: number) {
    this.scoreState.addResult(HitResultType.TICK_MISS, time);
  }

  addSliderEdge(object: Slider, time: number, index: number) {
    this.hitSound.playSliderEdge(object.o, index);

    // LAZER: slider ends don't add to combo
    if (index !== object.o.slides) {
      this.scoreState.addResult(HitResultType.EDGE_HIT, time);
    } else {
      this.scoreState.addResult(HitResultType.LAST_EDGE_HIT, time);
    }
  }

  missSliderEdge(object: Slider, time: number, index: number) {
    // LAZER: slider ends don't add to combo
    if (index !== object.o.slides) {
      this.scoreState.addResult(HitResultType.EDGE_MISS, time);
    } else {
      this.scoreState.addResult(HitResultType.LAST_EDGE_MISS, time);
    }
  }

  addSpinnerTick(
    type: HitResultType.SPIN_TICK | HitResultType.SPIN_BONUS,
    object: Spinner,
    time: number
  ) {
    this.scoreState.addResult(type, time);
    // TODO: play sound
  }

  update(time: number) {
    this.hitResult.update(time);
    this.scoreState.update(time);
  }
}
