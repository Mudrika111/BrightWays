declare module "*.css?inline" {
  const css: string;
  export default css;
}

type SortItem = {
  emoji: string;
  bin: string;
  origIdx: number;
};

declare global {
  interface Window {
    Chart?: new (canvas: HTMLCanvasElement | null, config: object) => {
      destroy(): void;
    };
    mmCheck?: (chosen: number, answer: number) => void;
    qrFlip?: (index: number) => void;
    stdCheck?: (tapped: number, correctIndex: number) => void;
    ndKey?: (key: string) => void;
    _ndCorrect?: string;
    routineTap?: (index: number) => void;
    feelCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    storyCheck?: (button: HTMLButtonElement, choice: string, answer: string) => void;
    smSelectItem?: (index: number) => void;
    smDropIntoBin?: (label: string) => void;
    _smItems?: SortItem[];
    phonicsCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    wmSelectImg?: (index: number) => void;
    wmSelectWord?: (index: number) => void;
    rtCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    lsCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
  }
}

export {};
