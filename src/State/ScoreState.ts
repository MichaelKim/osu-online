import { HitResultType } from '../HitResultController';
import ComboDisplay from '../HUD/ComboDisplay';
import ScoreDisplay from '../HUD/ScoreDisplay';
import Skin from '../Skin';

// Handle score calculations and passes score to ScoreDisplay
const ACCURACY_WEIGHT = 0.3;
const COMBO_WEIGHT = 0.7;

export enum SliderHitResultType {
  TICK_HIT,
  TICK_MISS,
  EDGE_HIT,
  EDGE_MISS
}

type HitResults = HitResultType | SliderHitResultType;

export default class ScoreState {
  combo: number = 0;
  score: number = 0;

  comboDisplay: ComboDisplay;
  scoreDisplay: ScoreDisplay;

  constructor(stage: PIXI.Container, skin: Skin) {
    this.comboDisplay = new ComboDisplay(stage, skin);
    this.scoreDisplay = new ScoreDisplay(stage, skin);

    // const score =
    //   1000000 *
    //     (accuracy * accuracy_portion +
    //       (combo / max_achievable_combo) * combo_portion) +
    //   bonus_portion;
  }

  addResult(result: HitResults, time: number) {
    switch (result) {
      case HitResultType.MISS:
      case SliderHitResultType.EDGE_MISS:
      case SliderHitResultType.TICK_MISS:
        this.combo = 0;
        break;
      case HitResultType.HIT50:
        this.score += 50;
        break;
      case HitResultType.HIT100:
        this.score += 100;
        break;
      case HitResultType.HIT300:
        this.score += 300;
        break;
      case SliderHitResultType.TICK_HIT:
        this.score += 10;
        break;
      case SliderHitResultType.EDGE_HIT:
        this.score += 30;
        break;
    }

    this.comboDisplay.setCombo(this.combo, time);
  }

  update(time: number) {
    this.comboDisplay.update(time);
    this.scoreDisplay.update(time);
  }
}
