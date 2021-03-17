import { createContext } from 'react';

export enum CursorType {
  DEFAULT, // Nothing
  LOCKED, // Pointer lock
  UNADJUSTED // Pointer lock with unadjusted movement
}

export const defaultOptions = {
  cursorType: CursorType.DEFAULT,
  supportsRawInput: true,
  cursorSensitivity: 2,
  leftButton: '1',
  rightButton: '2',
  animations: true
};

export type Options = typeof defaultOptions;

const OptionsContext = createContext<
  Options & {
    setOptions: (o: Partial<Options>) => void;
  }
>({
  ...defaultOptions,
  setOptions: () => {
    // No-op
  }
});

export default OptionsContext;
