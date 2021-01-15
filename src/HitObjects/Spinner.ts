import * as PIXI from 'pixi.js';
import { HitObjectTypes } from '.';
import {
  loadSpinnerSprites,
  SpinnerData,
  SpinnerSprites
} from '../Loader/SpinnerLoader';
import { Skin } from '../Skin';

export default class Spinner {
  readonly type = HitObjectTypes.SPINNER;

  // Sprites
  container: PIXI.Container;
  s: SpinnerSprites;

  // Gameplay
  lastPoint: PIXI.Point;
  lastTime: number = 0;
  spinProgress: number = 0;
  finished: number = 0;

  constructor(readonly o: SpinnerData, skin: Skin) {
    this.s = loadSpinnerSprites(this.o, skin);

    this.container = new PIXI.Container();
    this.lastPoint = new PIXI.Point();
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.container);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  update(time: number) {
    return false;
  }
}
