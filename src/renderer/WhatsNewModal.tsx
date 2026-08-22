import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import "./style.css";

interface Props {
  changelog: string;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<Props> = ({ changelog, onClose }) => {
  const lines = changelog.split(/\r?\n/).filter((l) => l.trim().length > 0);

  return (
    <AnimatePresence>
      <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="whatsnew-overlay" />
          <Dialog.Content asChild>
            <motion.div
              className="whatsnew-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Dialog.Title className="whatsnew-title">What’s New</Dialog.Title>
              <Dialog.Description asChild>
                <div className="whatsnew-body">
                  <ul className="whatsnew-list">
                    {lines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="whatsnew-ok">OK</button>
              </Dialog.Close>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AnimatePresence>
  );
};
