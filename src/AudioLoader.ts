import * as PIXI from 'pixi.js';

// Static class that handles audio loading

export interface AudioResource extends PIXI.LoaderResource {
  data: HTMLAudioElement;
}

const loader = new PIXI.Loader();
let resources: Record<string, AudioResource> = {};

export function load(url: string) {
  return new Promise<AudioResource>(resolve => {
    if (resources[url] != null) {
      return resources[url];
    }

    loader.add(url, url).load((_, res) => {
      resources[url] = res[url];
      resolve(resources[url]);
    });
  });
}
