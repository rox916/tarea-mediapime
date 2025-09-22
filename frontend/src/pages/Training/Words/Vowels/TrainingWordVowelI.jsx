import React, { useRef, useState } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useVocalLogic } from "../../../../hooks/useVocalLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingWordVowelI() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [modalData, setModalData] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  const {
    appState,
    startCollecting,
    stopCollecting,
    trainModel,
    resetData,
    handleLandmarks,
    handlePredict,
  } = useVocalLogic({ setModalData });

  // ✅ Inicializar cámara y modelo con MediaPipe Tasks
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentVowel: appState.currentVowel,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: handleLandmarks,
    onPredict: handlePredict,
  });

  // progreso actual de la vocal I
  const progressI = appState.vowelProgress?.i?.percentage || 0;

  // 👉 Botones dentro de CameraSection
  const actionsSlot = (
    <>
      {appState.isCollecting && progressI < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting("i")}
          disabled={progressI >= 100}
        >
          🎤 Recolectar 'I'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel("i")} // 👈 Entrena solo la 'i'
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo 'I'"}
      </button>

      <button className="action-btn reset-btn" onClick={() => resetData("i")}>
        🔄 Reiniciar Datos 'I'
      </button>
    </>
  );

  return (
    <div className="training-container">
      <div className="training-main">
        <div className="camera-card">
          <CameraSection
            videoRef={videoRef}
            canvasRef={canvasRef}
            isInitialized={isInitialized}
            error={error}
            actionsSlot={actionsSlot}
            // 👇 Progreso específico de la vocal 'i'
            progress={progressI}
          />
        </div>

        <div className="status-box">
          <StatusMessage message={appState.statusMessage} />
        </div>
      </div>

      <ConfirmModal
        isOpen={modalData.open}
        message={modalData.message}
        onConfirm={() => {
          modalData.onConfirm?.();
          setModalData({ open: false, message: "", onConfirm: null });
        }}
        onCancel={() =>
          setModalData({ open: false, message: "", onConfirm: null })
        }
      />
    </div>
  );
}
