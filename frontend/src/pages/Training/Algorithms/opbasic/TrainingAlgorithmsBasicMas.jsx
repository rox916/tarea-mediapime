// src/pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicMas.jsx
import React, { useRef, useState, useEffect } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useOpbasicLogic } from "../../../../hooks/useOpbasicLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingAlgorithmsBasicMas() {
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

  // 👈 usamos directamente "mas" (nombre humano esperado por el backend)
  const label = "mas";

  // ✅ Inicializar cámara y modelo con MediaPipe Tasks
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentOpbasic: appState.currentOpbasic,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    onLandmarks: (landmarks) => handleLandmarks(landmarks, label),
    onPredict: (landmarks) => handlePredict(landmarks, label),
  });

  // progreso actual de suma
  const progressMas = appState.opbasicProgress?.mas?.percentage || 0;

  // 🚨 Corte extra por seguridad
  useEffect(() => {
    if (progressMas >= 100 && appState.isCollecting) {
      console.log("🛑 Progreso completado, deteniendo recolección automáticamente.");
      stopCollecting();
    }
  }, [progressMas, appState.isCollecting, stopCollecting]);

  // 👉 Botones dentro de CameraSection
  const actionsSlot = (
    <>
      {appState.isCollecting && progressMas < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting(label)}
          disabled={progressMas >= 100}
        >
          🎤 Recolectar 'Suma'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel(label)}
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
            // 👇 Progreso específico de suma
            progress={progressMas}
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
