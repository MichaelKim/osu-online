import { defaultOptions, Options } from '../UI/options';

export default class OptionsController {
  private callbacks: Set<(o: Options) => void> = new Set();

  constructor(private _options = defaultOptions) {}

  get options(): Options {
    return this._options;
  }

  set(o: Partial<Options>) {
    this._options = {
      ...this._options,
      ...o
    };

    this.callbacks.forEach(cb => cb(this._options));
  }

  register(callback: (o: Options) => void) {
    callback(this.options);
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}
