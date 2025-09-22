import React, { useRef, useState, useEffect } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useVocalLogic } from "../../../../hooks/useVocalLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingWordVowelA() {
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

  // progreso actual de la vocal A
  const progressA = appState.vowelProgress?.a?.percentage || 0;

  // ✅ Inicializar cámara y modelo con MediaPipe Tasks
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentVowel: appState.currentVowel,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    vowelProgress: appState.vowelProgress,   // 👈 pasamos progreso
    onLandmarks: handleLandmarks,
    onPredict: handlePredict,
    onStopCollecting: () => {                // 👈 callback desde el hook
      console.log("🛑 Auto-stop desde useMediaPipeTasks (100% alcanzado).");
      stopCollecting();
    },
  });

  // 🚨 Corte extra por seguridad
  useEffect(() => {
    if (progressA >= 100 && appState.isCollecting) {
      console.log("🛑 Progreso completado, deteniendo recolección automáticamente.");
      stopCollecting();
    }
  }, [progressA, appState.isCollecting, stopCollecting]);

  // --- Funciones para los botones de la cámara ---
  const actionsSlot = (
    <>
      {appState.isCollecting && progressA < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting("a")}
          disabled={progressA >= 100}
        >
          🎤 Recolectar 'A'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel("a")}
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo 'A'"}
      </button>

      <button className="action-btn reset-btn" onClick={() => resetData("a")}>
        🔄 Reiniciar Datos 'A'
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
            progress={progressA}
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
