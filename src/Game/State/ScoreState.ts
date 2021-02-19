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
  combo = 0;

  rawScore = 0;
  bonusScore = 0;

  maxCombo = 0;
  maxScore = 0;

  comboDisplay: ComboDisplay;
  scoreDisplay: ScoreDisplay;

  constructor(stage: PIXI.Container, skin: Skin) {
    this.comboDisplay = new ComboDisplay(stage, skin);
    this.scoreDisplay = new ScoreDisplay(stage, skin);
  }

  load(beatmap: Beatmap) {
    for (const note of beatmap.notes) {
      switch (note.type) {
        case HitObjectTypes.HIT_CIRCLE:
          this.maxCombo += 1;
          this.maxScore += 300;
          break;
        case HitObjectTypes.SLIDER: {
          const numTicks = note.s.tickSprites.length; // Including repeats
          this.maxCombo += note.o.slides + numTicks;
          this.maxScore += 300 + (note.o.slides - 1) * 30 + numTicks * 10;
          break;
        }
        case HitObjectTypes.SPINNER:
          this.maxCombo += 1;
          this.maxScore +=
            note.o.rotationsNeeded * 10 + note.o.maxBonusSpins * 50;
          break;
      }
    }
  }

  getScore() {
    // LAZER: scorev2
    const accuracyRatio = this.rawScore / this.maxScore;
    const comboRatio = this.combo / this.maxCombo;
    return (
      1000000 * (accuracyRatio * ACCURACY_WEIGHT + comboRatio * COMBO_WEIGHT) +
      this.bonusScore
    );
  }

  addResult(result: HitResultType, time: number) {
    switch (result) {
      case HitResultType.MISS:
      case HitResultType.EDGE_MISS:
      case HitResultType.TICK_MISS:
        this.combo += 1;
        break;
      case HitResultType.HIT50:
        this.rawScore += 50;
        this.combo += 1;
        break;
      case HitResultType.HIT100:
        this.rawScore += 100;
        this.combo += 1;
        break;
      case HitResultType.HIT300:
        this.rawScore += 300;
        this.combo += 1;
        break;
      case HitResultType.TICK_HIT:
        this.rawScore += 10;
        this.combo += 1;
        break;
      case HitResultType.EDGE_HIT:
        this.rawScore += 30;
        this.combo += 1;
        break;
      case HitResultType.SPIN_TICK:
        this.bonusScore += 10;
        break;
      case HitResultType.SPIN_BONUS:
        this.bonusScore += 50;
        break;
    }

    this.comboDisplay.setCombo(this.combo, time);
    this.scoreDisplay.setScore(this.getScore(), time);
  }

  update(time: number) {
    this.comboDisplay.update(time);
    this.scoreDisplay.update(time);
  }
}
