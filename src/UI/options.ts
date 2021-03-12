import { createContext } from 'react';

export enum CursorType {
  DEFAULT, // Nothing
  LOCKED, // Pointer lock
  UNADJUSTED // Pointer lock with unadjusted movement
}

export type Options = {
  cursorType: CursorType;
  supportsRawInput: boolean;
  cursorSensitivity: number;
  leftButton: string;
  rightButton: string;
};

export const defaultOptions: Options = {
  cursorType: CursorType.DEFAULT,
  supportsRawInput: true,
  cursorSensitivity: 2,
  leftButton: '1',
  rightButton: '2'
};

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
