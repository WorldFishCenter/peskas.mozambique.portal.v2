"use client";

import { useAtom } from "jotai";
import { ModalEnum, modalStoreAtom, type Modal, type DataType } from "@/store/modal";
import UserModal from "./user-modal";

export default function ModalSwitcher() {
  const [modalState] = useAtom(modalStoreAtom);
  
  // Type cast the modal state
  const typedModal = modalState as Modal<ModalEnum>;

  // If modal is not open or not defined, don't render anything
  if (!typedModal?.open) return null;

  switch (typedModal.type) {
    case ModalEnum.USER:
      return <UserModal data={typedModal.data as DataType[ModalEnum.USER]} />;
    default:
      return null;
  }
}
