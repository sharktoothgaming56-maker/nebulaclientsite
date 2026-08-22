import React, { useEffect, useState } from "react";
import { WhatsNewModal } from "./WhatsNewModal";

interface UpdateState {
  downloading: boolean;
  downloaded: boolean;
  version?: string;
  changelog?: string;
}

export const App: React.FC = () => {
  const [updateState, setUpdateState] = useState<UpdateState>({ downloading: false, downloaded: false });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    window.electronAPI?.onUpdateState((state: unknown) => {
      const upd = state as UpdateState;
      setUpdateState(upd);
      if (upd.downloaded) setShowModal(true);
    });
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Launcher (v{updateState.version ?? "unknown"})</h1>
      {showModal && (
        <WhatsNewModal
          changelog={updateState.changelog ?? "No details available."}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};
