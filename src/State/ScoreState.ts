import Beatmap from '../Beatmap';
import { HitObjectTypes } from '../HitObjects';
import { HitResultType } from '../HitResultController';
import ComboDisplay from '../HUD/ComboDisplay';
import ScoreDisplay from '../HUD/ScoreDisplay';
import Skin from '../Skin';

// Handle score calculations and passes score to ScoreDisplay
const ACCURACY_WEIGHT = 0.3;
const COMBO_WEIGHT = 0.7;

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

  load(beatmap: Beatmap) {
    // Calculate maximum score
    // Calculate maximum combo
    let maxScore = 0;
    let maxCombo = 0;

    for (const note of beatmap.notes) {
      switch (note.type) {
        case HitObjectTypes.HIT_CIRCLE:
          maxCombo += 1;
          maxScore += 300;
          break;
        case HitObjectTypes.SLIDER: {
          const numTicks = note.s.tickSprites.length;
          maxCombo += note.o.slides * (1 + numTicks);
          maxScore +=
            300 + (note.o.slides - 1) * 30 + note.o.slides * numTicks * 10;
          break;
        }
        case HitObjectTypes.SPINNER: {
          maxCombo += 1;
          maxScore += note.o.rotationsNeeded * 10 + note.o.maxBonusSpins * 50;
          break;
        }
      }
    }
  }

  addResult(result: HitResultType, time: number) {
    switch (result) {
      case HitResultType.MISS:
      case HitResultType.EDGE_MISS:
      case HitResultType.TICK_MISS:
        this.combo = 0;
        break;
      case HitResultType.HIT50:
        this.score += 50;
        this.combo += 1;
        break;
      case HitResultType.HIT100:
        this.score += 100;
        this.combo += 1;
        break;
      case HitResultType.HIT300:
        this.score += 300;
        this.combo += 1;
        break;
      case HitResultType.TICK_HIT:
        this.score += 10;
        break;
      case HitResultType.EDGE_HIT:
        this.score += 30;
        this.combo += 1;
      case HitResultType.SPIN_TICK:
        this.score += 10;
        break;
      case HitResultType.SPIN_BONUS:
        this.score += 50;
        break;
    }

    this.comboDisplay.setCombo(this.combo, time);
    this.scoreDisplay.setScore(this.score, time);
  }

  update(time: number) {
    this.comboDisplay.update(time);
    this.scoreDisplay.update(time);
  }
}
