import { atom, useAtom } from "jotai";

import type { ReactNode } from "react";

export enum ModalEnum {
  USER = "USER",
}

export interface DataType {
  [ModalEnum.USER]: {
    id: string;
  };
}

export interface Modal<T extends ModalEnum> {
  open: boolean;
  type: T | undefined;
  content?: ReactNode;
  data?: DataType[T];
}

export const modalStoreAtom = atom<Modal<ModalEnum> | {}>({});

