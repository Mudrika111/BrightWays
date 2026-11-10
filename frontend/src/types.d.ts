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
    mmCheck?: (chosen: number, answer: number, button: HTMLButtonElement) => void;
    qrFlip?: (index: number) => void;
    stdCheck?: (tapped: number, correctIndex: number) => void;
    ndKey?: (key: string) => void;
    _ndCorrect?: string;
    ffChoose?: (index: number) => void;
    ffCheck?: () => void;
    ffNext?: () => void;
    soChoose?: (index: number) => void;
    soCheck?: () => void;
    soReset?: () => void;
    soRemove?: (position: number) => void;
    soNext?: () => void;
    resetChoose?: (index: number) => void;
    resetNext?: () => void;
    resetSkip?: () => void;
    trailMove?: (direction: "up" | "down" | "left" | "right") => void;
    trailNext?: () => void;
    critterChoose?: (index: number) => void;
    critterBack?: () => void;
    critterNext?: () => void;
    critterFinish?: () => void;
    routineTap?: (index: number) => void;
    feelCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    storyCheck?: (button: HTMLButtonElement, choice: string, answer: string) => void;
    smSelectItem?: (index: number) => void;
    smDropIntoBin?: (label: string) => void;
    comfortToggle?: (index: number) => void;
    comfortFinish?: () => void;
    comfortSkip?: () => void;
    choiceSelect?: (index: number) => void;
    choiceNext?: () => void;
    _smItems?: SortItem[];
    phonicsCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    wmSelectImg?: (index: number) => void;
    wmSelectWord?: (index: number) => void;
    rtCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    lsCheck?: (choice: string, button: HTMLButtonElement, answer: string) => void;
    wbPick?: (index: number) => void;
    wbRemove?: (slot: number) => void;
    wbClear?: () => void;
    wbCheck?: () => void;
    wbNext?: () => void;
    syllablePick?: (index: number) => void;
    syllableRemove?: (slot: number) => void;
    syllableClear?: () => void;
    syllableNext?: () => void;
  }
}

export {};
