// src/pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber0.jsx
import React, { useRef, useState } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useNumberLogic } from "../../../../hooks/useNumberLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingAlgorithmsNumber0() {
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
    deleteNumberData,
    handleLandmarks,
    handlePredict,
  } = useNumberLogic({ setModalData });

  const label = "0";

  // Inicializar cámara con MediaPipe
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentNumber: appState.currentNumber,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: (landmarks) => handleLandmarks(landmarks, label),
    onPredict: (landmarks) => handlePredict(landmarks, label),
  });

  // Progreso actual del número 0
  const progress = appState.numberProgress?.[label]?.percentage || 0;

  const actionsSlot = (
    <>
      {appState.isCollecting && progress < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting(label)}
          disabled={progress >= 100}
        >
          🎤 Recolectar '{label}'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel(label)}
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo"}
      </button>

      <button
        className="action-btn reset-btn"
        onClick={() => resetData(label)}
      >
        🔄 Reiniciar Datos
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
            progress={progress}
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
