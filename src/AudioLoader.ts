import * as PIXI from 'pixi.js';

// Static class that handles audio loading

export interface AudioResource extends PIXI.LoaderResource {
  data: HTMLAudioElement;
}

const loader = new PIXI.Loader();
let resources: Record<string, AudioResource> = {};

export function load(url: string) {
  return new Promise<AudioResource>((resolve, reject) => {
    // Cached
    if (resources[url] != null) {
      return resolve(resources[url]);
    }

    loader
      .add(url, url)
      .load((_, res: Partial<Record<string, AudioResource>>) => {
        const data = res[url];
        if (data == null || data.error !== null) {
          console.error('Error while loading audio:', url);
          reject(data?.error);
        } else {
          resources[url] = data;
          resolve(resources[url]);
        }
      });
  });
}
