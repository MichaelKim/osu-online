import * as PIXI from 'pixi.js';
import Skin from '../Skin';
import { clerp } from '../util';

const SCORE_DIGIT_WIDTH = 30;
const COMBO_POP_TIME = 250;
const COMBO_POP_2_TIME = 100;
const MAX_COMBO_DIGITS = 6;

class ComboContainer extends PIXI.Container {
  combo: number = 0;
  updateTime: number = 0;
  sprites: PIXI.Sprite[] = [];

  countdown: number = 0;

  constructor(private skin: Skin) {
    super();
    const spriteHeight = skin.scores[0]?.height ?? 0;
    for (let i = 0; i < MAX_COMBO_DIGITS; i++) {
      const sprite = new PIXI.Sprite();
      sprite.position.set((i + 0.5) * SCORE_DIGIT_WIDTH, -spriteHeight);
      this.sprites.push(sprite);
      this.addChild(sprite);
    }
  }

  update(time: number) {
    if (this.countdown > 0) {
      const num = Math.round(
        clerp(time - this.countdown, 0, 100, this.combo, 0)
      );
      this.setSprites(num);
      if (num === 0) {
        this.countdown = 0;
        this.combo = 0;
      }
      return;
    }

    const delta = time - this.updateTime;
    if (delta < COMBO_POP_2_TIME) {
      this.scale.set(clerp(delta, 0, COMBO_POP_2_TIME, 2.2, 2));
    } else {
      this.scale.set(2);
    }
  }

  setCombo(combo: number, time: number) {
    if (combo === this.combo) return;
    if (combo === 0) {
      // Count down from this.combo to 0
      this.countdown = time;
      return;
    }

    this.countdown = 0;
    this.combo = combo;
    this.updateTime = time;
    this.setSprites(combo);
  }

  setSprites(value: number) {
    const length = value === 0 ? 1 : Math.floor(Math.log10(value) + 1);
    for (let i = this.sprites.length - 1; i > length; i--) {
      this.sprites[i].texture = PIXI.Texture.EMPTY;
    }

    this.sprites[length].texture = this.skin.scoreX || PIXI.Texture.EMPTY;

    for (let i = length - 1; i >= 0; i--) {
      const digit = Math.floor(value % 10);
      this.sprites[i].texture = this.skin.scores[digit] || PIXI.Texture.EMPTY;

      value /= 10;
    }
  }
}

class PopComboContainer extends PIXI.Container {
  combo: number = 0;
  updateTime: number = 0;
  sprites: PIXI.Sprite[] = [];

  constructor(private skin: Skin) {
    super();
    const spriteHeight = skin.scores[0]?.height ?? 0;
    for (let i = 0; i < MAX_COMBO_DIGITS; i++) {
      const sprite = new PIXI.Sprite();
      sprite.position.set((i + 0.5) * SCORE_DIGIT_WIDTH, -spriteHeight);
      this.sprites.push(sprite);
      this.addChild(sprite);
    }
  }

  update(time: number) {
    const delta = time - this.updateTime;

    if (delta < COMBO_POP_TIME) {
      this.visible = true;
      this.scale.set(clerp(delta, 0, COMBO_POP_TIME, 3, 2));
      return false;
    } else {
      this.visible = false;
      return true;
    }
  }

  setCombo(combo: number, time: number) {
    if (this.combo === combo) return;

    this.combo = combo;
    this.updateTime = time;
    this.visible = true;
    this.setSprites(combo);
  }

  setSprites(value: number) {
    const length = Math.floor(Math.log10(value) + 1);
    for (let i = this.sprites.length - 1; i > length; i--) {
      this.sprites[i].texture = PIXI.Texture.EMPTY;
    }

    this.sprites[length].texture = this.skin.scoreX || PIXI.Texture.EMPTY;

    for (let i = length - 1; i >= 0; i--) {
      const digit = Math.floor(value % 10);
      this.sprites[i].texture = this.skin.scores[digit] || PIXI.Texture.EMPTY;

      value /= 10;
    }
  }
}

/*
When new combo is added, (4 -> 5)
- pop combo pops with new combo (5)
- if the regular combo is still on the old combo (3), replace it with next (4)
- if pop combo finishes pop, update regular combo (5)
- when the regular combo updates (either delay from pop combo or pop combo is +2), pop it 
*/

export default class ComboDisplay {
  // Graphics
  container: ComboContainer; // Regular combo display
  popContainer: PopComboContainer; // "Pop" combo display

  constructor(stage: PIXI.Container, skin: Skin) {
    this.container = new ComboContainer(skin);
    this.popContainer = new PopComboContainer(skin);

    // Set to bottom-right
    const margin = window.innerWidth * 0.008;
    this.container.position.set(margin, window.innerHeight - margin);
    this.popContainer.position.set(margin, window.innerHeight - margin);
    this.popContainer.alpha = 0.5;
    this.popContainer.visible = false;

    stage.addChild(this.popContainer, this.container);
  }

  setCombo(combo: number, time: number) {
    if (combo === 0) {
      this.popContainer.visible = false;
      this.container.setCombo(0, time);
      return;
    }

    if (this.popContainer.visible) {
      // Previous pop still ongoing, force update regular combo
      this.container.setCombo(this.popContainer.combo, time);
    }

    this.popContainer.setCombo(combo, time);
  }

  update(time: number) {
    if (this.popContainer.visible && this.popContainer.update(time)) {
      // Pop done, copy to regular
      this.container.setCombo(this.popContainer.combo, time);
    }

    this.container.update(time);
  }
}
