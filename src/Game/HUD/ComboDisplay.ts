import { Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import Renderer from '../Renderer';
import Skin from '../Skin';
import { clerp, clerp01 } from '../util';

const SCORE_DIGIT_WIDTH = 30;
const COMBO_POP_TIME = 250;
const COMBO_POP_2_TIME = 100;
const MAX_COMBO_DIGITS = 6;

class ComboContainer extends Container {
  combo = 0;
  sprites: Sprite[] = [];

  constructor(private skin: Skin) {
    super();
    const spriteHeight = skin.scores[0].height;
    for (let i = 0; i < MAX_COMBO_DIGITS; i++) {
      const sprite = new Sprite();
      sprite.position.set((i + 0.5) * SCORE_DIGIT_WIDTH, -spriteHeight);
      this.sprites.push(sprite);
      this.addChild(sprite);
    }
  }

  setCombo(combo: number) {
    this.combo = combo;

    const length = combo === 0 ? 1 : Math.floor(Math.log10(combo) + 1);
    for (let i = this.sprites.length - 1; i > length; i--) {
      this.sprites[i].texture = Texture.EMPTY;
    }

    this.sprites[length].texture = this.skin.scoreX;

    for (let i = length - 1; i >= 0; i--) {
      const digit = Math.floor(combo % 10);
      this.sprites[i].texture = this.skin.scores[digit];

      combo /= 10;
    }
  }
}

type Update = (time: number) => boolean;
type Node = {
  update: Update;
  next: Node[];
};

class Updater {
  updates: Node[] = [];

  // Clear all ongoing updates
  clear() {
    this.updates = [];
    return this;
  }

  chain(...us: Update[]) {
    this.updates.push(
      ...us.reduceRight<Node[]>(
        (next, u) => [
          {
            update: u,
            next
          }
        ],
        []
      )
    );
  }

  update(time: number) {
    // TODO: this is slow
    this.updates = this.updates.flatMap(u => {
      if (u.update(time)) {
        return u.next;
      }
      return u;
    });
  }
}

// TODO: add duration to updates?

export default class ComboDisplay {
  // Graphics
  container: ComboContainer; // Regular combo display
  popContainer: ComboContainer; // "Pop" combo display
  updates: Updater = new Updater();

  constructor(renderer: Renderer, skin: Skin) {
    this.container = new ComboContainer(skin);
    this.popContainer = new ComboContainer(skin);

    this.popContainer.alpha = 0.5;
    this.popContainer.visible = false;

    renderer.displayStage.addChild(this.popContainer, this.container);
    renderer.onResize((width, height) => {
      // Set to bottom-left
      const margin = width * 0.008;
      this.container.position.set(margin, height - margin);
      this.popContainer.position.set(margin, height - margin);
    });
  }

  setCombo(combo: number, time: number) {
    if (this.popContainer.combo === combo) {
      return;
    }

    if (combo === 0) {
      // Hide pop
      this.popContainer.visible = false;
      this.popContainer.setCombo(0);

      const startCombo = this.container.combo;

      const countdown = (t: number) => {
        // Count down from this.combo to 0
        const num = Math.round(clerp(t - time, 0, 100, startCombo, 0));
        this.container.setCombo(num);
        return num === 0;
      };

      const fadeOut = (t: number) => {
        // Fade out
        const alpha = 1 - clerp01(t - time - 100, 0, 100);
        this.container.alpha = alpha;
        return alpha === 0;
      };

      this.updates.clear().chain(countdown, fadeOut);
      return;
    }

    if (this.popContainer.combo !== this.container.combo) {
      // Previous pop still ongoing, force update regular combo
      this.container.setCombo(this.popContainer.combo);

      const popCombo = (t: number) => {
        // Pop combo number
        const scale = clerp(
          t - time - COMBO_POP_TIME,
          0,
          COMBO_POP_2_TIME,
          2.2,
          2
        );
        this.container.scale.set(scale);
        return scale === 2;
      };

      const popBoth = (t: number) => {
        // Pop both counters
        const delta = t - time;
        const comboScale = clerp(delta, 0, COMBO_POP_2_TIME, 2.2, 2);
        this.container.scale.set(comboScale);

        const popScale = clerp(delta, 0, COMBO_POP_TIME, 3, 2);
        this.popContainer.scale.set(popScale);

        return comboScale === 2 && popScale === 2;
      };

      this.updates.clear().chain(popBoth, this.hide, popCombo);
    } else {
      const popPop = (t: number) => {
        // Pop pop
        const scale = clerp(t - time, 0, COMBO_POP_TIME, 3, 2);
        this.popContainer.scale.set(scale);
        return scale === 2;
      };

      const popCombo = (t: number) => {
        // Pop combo number
        const scale = clerp(
          t - time - COMBO_POP_TIME,
          0,
          COMBO_POP_2_TIME,
          2.2,
          2
        );
        this.container.scale.set(scale);
        return scale === 2;
      };

      this.updates.chain(popPop, this.hide, popCombo);
    }

    this.container.alpha = 1;
    this.popContainer.visible = true;
    this.popContainer.setCombo(combo);
  }

  hide = () => {
    // Pop done, copy to regular
    this.container.setCombo(this.popContainer.combo);
    this.popContainer.visible = false;
    return true;
  };

  update(time: number) {
    this.updates.update(time);
  }

  reset() {
    this.container.setCombo(0);
    this.container.alpha = 0;

    this.popContainer.setCombo(0);
    this.popContainer.visible = false;
  }
}
