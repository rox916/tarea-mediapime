// src/pages/Predictions/PredictionsVowels.jsx
import React, { useRef, useState } from "react";
import { useMediaPipeTasks } from "../../hooks/useMediaPipeTasks.js";
import { useVocalLogic } from "../../hooks/useVocalLogic.js";
import PredictionCameraSection from "../../components/camera/PredictionCameraSection.jsx";
import StatusMessage from "../../components/feedback/StatusMessage.jsx";

export default function PredictionsVowels() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [modalData, setModalData] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  const { appState, handlePredict, togglePrediction } = useVocalLogic({ setModalData });

  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isPredicting: appState.isPredicting,
    isModelTrained: appState.isModelTrained,
    onPredict: (landmarks) => {
      console.log("🔮 Landmarks detectados:", landmarks);
      handlePredict(landmarks);
    },
  });

  return (
    <div className="training-container">
      <div className="training-main">
        {/* 🔤 Título y subtítulo con clases */}
        <h2 className="prediction-title">🔤 Predicción de Vocales</h2>
        <p className="prediction-subtitle">
          Aquí podrás usar el modelo entrenado para reconocer vocales en vivo.
        </p>

        {/* 📷 Cámara con botón integrado */}
        <div className="camera-card">
          <PredictionCameraSection
            videoRef={videoRef}
            canvasRef={canvasRef}
            isInitialized={isInitialized}
            error={error}
            actionsSlot={
              <div className="camera-actions">
                <button
                  className={`action-btn ${
                    appState.isPredicting ? "stop-btn" : "collect-btn"
                  }`}
                  onClick={togglePrediction}
                  disabled={!appState.isModelTrained}
                >
                  {appState.isPredicting
                    ? "🛑 Detener Predicción"
                    : "▶️ Iniciar Predicción"}
                </button>
              </div>
            }
          />

          {/* 🔤 Overlay con la vocal detectada */}
          {appState.prediction && (
            <div className="prediction-overlay">
              {appState.prediction.toUpperCase()}
            </div>
          )}
        </div>

        {/* 📊 Estado y resultados */}
        <div className="status-box">
          <StatusMessage message={appState.statusMessage} />
          {appState.prediction && (
            <div>
              <h3>Vocal detectada: {appState.prediction.toUpperCase()}</h3>
              <p>
                Confianza: {(appState.predictionConfidence * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
