import { Dialog } from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import React from "react";
import UserEditFieldset from "./UserEditFieldSet";

const Modal = ({
  isOpen,
  onClose,
  user,
  onUserChange,
  onSave,
  supervisores = [],
  children,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      transition
      className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-closed:opacity-0"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="flex items-center justify-center min-h-screen w-full">
        <Dialog.Panel className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-xl w-full relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-cyan-400 text-xl font-bold focus:outline-none"
            aria-label="Cerrar"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
          {user && onUserChange ? (
            <UserEditFieldset
              user={user}
              onChange={onUserChange}
              onSave={onSave}
              supervisores={supervisores}
            />
          ) : (
            children
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default Modal;
