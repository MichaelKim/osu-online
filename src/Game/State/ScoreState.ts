import { HitObject, HitObjectTypes } from '../HitObjects';
import { HitResultType } from '../HitResultController';
import AccuracyDisplay from '../HUD/AccuracyDisplay';
import ComboDisplay from '../HUD/ComboDisplay';
import ScoreDisplay from '../HUD/ScoreDisplay';
import Renderer from '../Renderer';
import Skin from '../Skin';

// Handle score calculations and passes score to ScoreDisplay
const ACCURACY_WEIGHT = 0.3;
const COMBO_WEIGHT = 0.7;
const MAX_SCORE = 1_000_000;

export type GameResult = {
  highestCombo: number;
  maxCombo: number;
  score: number;
  accuracy: number;
  hits: Record<HitResultType, number>;
};

export default class ScoreState {
  // Combo
  currentCombo = 0;
  highestCombo = 0;
  // Score
  rawScore = 0;
  bonusScore = 0;
  cumulativeScore = 0;
  // Hit counts
  hits: Record<HitResultType, number> = {
    [HitResultType.MISS]: 0,
    [HitResultType.HIT50]: 0,
    [HitResultType.HIT100]: 0,
    [HitResultType.HIT300]: 0,
    [HitResultType.TICK_HIT]: 0,
    [HitResultType.TICK_MISS]: 0,
    [HitResultType.EDGE_HIT]: 0,
    [HitResultType.EDGE_MISS]: 0,
    [HitResultType.LAST_EDGE_HIT]: 0,
    [HitResultType.LAST_EDGE_MISS]: 0,
    [HitResultType.SPIN_TICK]: 0,
    [HitResultType.SPIN_BONUS]: 0
  };
  // Computed before play
  maxCombo = 0;
  maxScore = 0;

  comboDisplay: ComboDisplay;
  scoreDisplay: ScoreDisplay;
  accuracyDisplay: AccuracyDisplay;

  constructor(renderer: Renderer, skin: Skin) {
    this.comboDisplay = new ComboDisplay(renderer, skin);
    this.scoreDisplay = new ScoreDisplay(renderer, skin);
    this.accuracyDisplay = new AccuracyDisplay(renderer, skin);
  }

  load(notes: HitObject[]) {
    for (const note of notes) {
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

  // Clear play data
  restart() {
    this.currentCombo = 0;
    this.highestCombo = 0;
    this.rawScore = 0;
    this.bonusScore = 0;
    this.cumulativeScore = 0;
    this.comboDisplay.reset();
    this.scoreDisplay.reset();
    this.accuracyDisplay.reset();
  }

  // Clear beatmap data
  reset() {
    this.restart();
    this.maxCombo = 0;
    this.maxScore = 0;
  }

  getState(): GameResult {
    return {
      highestCombo: this.highestCombo,
      maxCombo: this.maxCombo,
      score: this.getScore(),
      accuracy: this.getAccuracy(),
      hits: this.hits
    };
  }

  private getAccuracy() {
    return this.rawScore / this.cumulativeScore;
  }

  private getScore() {
    // LAZER: scorev2
    const accuracyRatio = this.getAccuracy();
    const comboRatio = this.highestCombo / this.maxCombo;
    return (
      MAX_SCORE *
        (accuracyRatio * ACCURACY_WEIGHT + comboRatio * COMBO_WEIGHT) +
      this.bonusScore
    );
  }

  addResult(result: HitResultType, time: number) {
    this.hits[result]++;

    switch (result) {
      case HitResultType.MISS:
        this.cumulativeScore += 300;
        this.currentCombo = 0;
        this.currentCombo = 0;
        break;
      case HitResultType.EDGE_MISS:
        this.cumulativeScore += 30;
        this.currentCombo = 0;
        this.currentCombo = 0;
        break;
      case HitResultType.TICK_MISS:
        this.cumulativeScore += 10;
        this.currentCombo = 0;
        this.currentCombo = 0;
        break;
      case HitResultType.HIT50:
        this.rawScore += 50;
        this.cumulativeScore += 300;
        this.currentCombo += 1;
        break;
      case HitResultType.HIT100:
        this.rawScore += 100;
        this.cumulativeScore += 300;
        this.currentCombo += 1;
        break;
      case HitResultType.HIT300:
        this.rawScore += 300;
        this.cumulativeScore += 300;
        this.currentCombo += 1;
        break;
      case HitResultType.TICK_HIT:
        this.rawScore += 10;
        this.cumulativeScore += 10;
        this.currentCombo += 1;
        break;
      case HitResultType.EDGE_HIT:
        this.rawScore += 30;
        this.cumulativeScore += 30;
        this.currentCombo += 1;
        break;
      case HitResultType.SPIN_TICK:
        this.bonusScore += 10;
        this.cumulativeScore += 10;
        break;
      case HitResultType.SPIN_BONUS:
        this.bonusScore += 50;
        this.cumulativeScore += 30;
        break;
    }

    this.highestCombo = Math.max(this.highestCombo, this.currentCombo);

    this.comboDisplay.setCombo(this.currentCombo, time);
    this.scoreDisplay.setScore(this.getScore(), time);
    this.accuracyDisplay.setAccuracy(this.getAccuracy());
  }

  update(time: number) {
    this.comboDisplay.update(time);
    this.scoreDisplay.update(time);
  }
}
