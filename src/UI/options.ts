import { createContext } from 'react';

export type Options = {
  rawInput: boolean;
  supportsRawInput: boolean;
  cursorSensitivity: number;
  leftButton: string;
  rightButton: string;
};

export const defaultOptions: Options = {
  rawInput: true,
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
