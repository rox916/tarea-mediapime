// src/pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicMultipl.jsx
import React, { useRef, useState } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useOpbasicLogic } from "../../../../hooks/useOpbasicLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingAlgorithmsBasicMultipl() {
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
  } = useOpbasicLogic({ setModalData });

  // 👈 usamos nombre humano directamente
  const label = "multiplicacion";

  // ✅ Inicializar cámara y modelo con MediaPipe Tasks
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentLabel: label, // 👈 se manda "multiplicacion" al backend
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: (landmarks) => handleLandmarks(landmarks, label),
    onPredict: (landmarks) => handlePredict(landmarks, label),
  });

  // Progreso actual de multiplicación
  const progressMultipl =
    appState.opbasicProgress?.multiplicacion?.percentage || 0;

  // 👉 Botones dentro de CameraSection
  const actionsSlot = (
    <>
      {appState.isCollecting && progressMultipl < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting(label)} // 👈 usamos "multiplicacion"
          disabled={progressMultipl >= 100}
        >
          🎤 Recolectar 'Multiplicación'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel(label)} // 👈 usamos "multiplicacion"
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo"}
      </button>

      <button className="action-btn reset-btn" onClick={() => resetData(label)}>
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
            progress={progressMultipl} // 👇 progreso específico
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
