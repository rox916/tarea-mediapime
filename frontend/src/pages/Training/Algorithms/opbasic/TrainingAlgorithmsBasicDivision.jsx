// src/pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicDivision.jsx
import React, { useRef, useState } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useOpbasicLogic } from "../../../../hooks/useOpbasicLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingAlgorithmsBasicDivision() {
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

  // ✅ Inicializar cámara y modelo con MediaPipe Tasks
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentOpbasic: appState.currentOpbasic,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: (landmarks) => handleLandmarks(landmarks, "division"), // fijo
    onPredict: (landmarks) => handlePredict(landmarks, "division"),     // fijo
  });

  // progreso actual de división
  const progressDivision = appState.opbasicProgress?.division?.percentage || 0;

  // 👉 Botones dentro de CameraSection
  const actionsSlot = (
    <>
      {appState.isCollecting && progressDivision < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting("division")}
          disabled={progressDivision >= 100}
        >
          🎤 Recolectar 'División'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel("division")}
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo"}
      </button>

      <button
        className="action-btn reset-btn"
        onClick={() => resetData("division")}
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
            // 👇 Progreso específico de división
            progress={progressDivision}
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
