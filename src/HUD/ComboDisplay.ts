import * as PIXI from 'pixi.js';
import Skin from '../Skin';
import { clerp, clerp01 } from '../util';

const SCORE_DIGIT_WIDTH = 30;
const COMBO_POP_TIME = 250;
const COMBO_POP_2_TIME = 100;
const MAX_COMBO_DIGITS = 6;

class ComboContainer extends PIXI.Container {
  combo: number = 0;
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

  setCombo(combo: number) {
    this.combo = combo;

    const length = combo === 0 ? 1 : Math.floor(Math.log10(combo) + 1);
    for (let i = this.sprites.length - 1; i > length; i--) {
      this.sprites[i].texture = PIXI.Texture.EMPTY;
    }

    this.sprites[length].texture = this.skin.scoreX || PIXI.Texture.EMPTY;

    for (let i = length - 1; i >= 0; i--) {
      const digit = Math.floor(combo % 10);
      this.sprites[i].texture = this.skin.scores[digit] || PIXI.Texture.EMPTY;

      combo /= 10;
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
type Update = (time: number) => boolean;
type Node = {
  update: Update;
  next: Node[];
};

class Test {
  updates: Node[] = [];

  // Clear all ongoing updates
  clear() {
    this.updates = [];
    return this;
  }

  // add<T extends []>(u: (time: number, ...args: T) => boolean, ...args: T) {
  //   const node: Node = {
  //     update: t => u(t, ...args),
  //     next: []
  //   };
  //   this.updates.push(node);

  //   let next = node.next;
  //   const then = <U extends []>(
  //     u: (time: number, ...args: U) => boolean,
  //     ...args: U
  //   ) => {
  //     const nextNode: Node = {
  //       update: t => u(t, ...args),
  //       next: []
  //     };
  //     next.push(nextNode);
  //     next = nextNode.next;
  //     return {
  //       add: this.add,
  //       then
  //     };
  //   };

  //   return {
  //     add: this.add,
  //     then
  //   };
  // }

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
    this.updates = this.updates.flatMap(u => {
      if (u.update(time)) {
        return u.next;
      }
      return u;
    });
  }
}

export default class ComboDisplay {
  // Graphics
  container: ComboContainer; // Regular combo display
  popContainer: ComboContainer; // "Pop" combo display
  updates: Test = new Test();

  constructor(stage: PIXI.Container, skin: Skin) {
    this.container = new ComboContainer(skin);
    this.popContainer = new ComboContainer(skin);

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

  hide() {
    // Pop done, copy to regular
    this.container.setCombo(this.popContainer.combo);
    this.popContainer.visible = false;
    return true;
  }

  update(time: number) {
    this.updates.update(time);
  }
}
