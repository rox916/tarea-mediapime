import React, { useRef, useState, useEffect } from "react";
import { useMediaPipeTasks } from "../../../../hooks/useMediaPipeTasks.js";
import { useVocalLogic } from "../../../../hooks/useVocalLogic.js";

import CameraSection from "../../../../components/camera/CameraSection.jsx";
import StatusMessage from "../../../../components/feedback/StatusMessage.jsx";
import ConfirmModal from "../../../../components/modals/ConfirmModal.jsx";

export default function TrainingWordVowelU() {
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

  // progreso actual de la vocal U
  const progressU = appState.vowelProgress?.u?.percentage || 0;

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
    if (progressU >= 100 && appState.isCollecting) {
      console.log("🛑 Progreso completado, deteniendo recolección automáticamente.");
      stopCollecting();
    }
  }, [progressU, appState.isCollecting, stopCollecting]);

  // --- Funciones para los botones de la cámara ---
  const actionsSlot = (
    <>
      {appState.isCollecting && progressU < 100 ? (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          ⏸️ Detener Recolección
        </button>
      ) : (
        <button
          className="action-btn collect-btn"
          onClick={() => startCollecting("u")}
          disabled={progressU >= 100}
        >
          🎤 Recolectar 'U'
        </button>
      )}

      <button
        className="action-btn train-btn"
        onClick={() => trainModel("u")}
        disabled={appState.isTraining}
      >
        {appState.isTraining ? "⏳ Entrenando..." : "🧠 Entrenar Modelo 'U'"}
      </button>

      <button className="action-btn reset-btn" onClick={() => resetData("u")}>
        🔄 Reiniciar Datos 'U'
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
            progress={progressU}
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
