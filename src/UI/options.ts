import { createContext } from 'react';

export type Options = {
  cursorSensitivity: number;
  test: string;
};

export const defaultOptions: Options = {
  cursorSensitivity: 2,
  test: ''
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
