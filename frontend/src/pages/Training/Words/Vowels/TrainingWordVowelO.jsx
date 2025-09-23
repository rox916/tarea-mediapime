import React, { useRef, useState, useEffect } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useVocalLogic } from "../../../../hooks/useVocalLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingWordVowelO() {
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

  // progreso actual de la vocal O
  const progressO = appState.vowelProgress?.o?.percentage || 0;

  // ✅ Inicializar cámara y modelo con MediaPipe Tasks
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isCollecting: appState.isCollecting,
    currentVowel: appState.currentVowel,
    isModelTrained: appState.isModelTrained,
    isPredicting: appState.isPredicting,
    vowelProgress: appState.vowelProgress,
    onLandmarks: handleLandmarks,
    onPredict: handlePredict,
  });

  // 🚨 Corte extra por seguridad
  useEffect(() => {
    if (progressO >= 100 && appState.isCollecting) {
      console.log("🛑 Progreso completado, deteniendo recolección automáticamente.");
      stopCollecting();
    }
  }, [progressO, appState.isCollecting, stopCollecting]);

  // --- Funciones para los botones de la cámara ---
  const actionsSlot = (
    <>
      {appState.isCollecting && progressO < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting("o")}
          disabled={progressO >= 100}
        >
          🎤 Recolectar 'O'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel("o")}
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo 'O'"}
      </button>

      <button className="action-btn reset-btn" onClick={() => resetData("o")}>
        🔄 Reiniciar Datos 'O'
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
            progress={progressO}
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
