// src/pages/Predictions/PredictionsVowels.jsx
import React, { useRef, useState } from "react";
import { useMediaPipeTasks } from "../../hooks/useMediaPipeTasks.js";
import { useVocalLogic } from "../../hooks/useVocalLogic.js";
import CameraSection from "../../components/camera/CameraSection.jsx";
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

  // Pasamos también isModelTrained
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
        <h2>🔤 Predicción de Vocales</h2>
        <p>Aquí podrás usar el modelo entrenado para reconocer vocales en vivo.</p>

        {/* 📷 Cámara con botón integrado */}
        <div className="camera-card" style={{ position: "relative" }}>
          <CameraSection
            videoRef={videoRef}
            canvasRef={canvasRef}
            isInitialized={isInitialized}
            error={error}
            actionsSlot={
              <button
                onClick={togglePrediction}
                disabled={!appState.isModelTrained}
                style={{
                  padding: "10px 20px",
                  backgroundColor: appState.isPredicting ? "#e74c3c" : "#2ecc71",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: appState.isModelTrained ? "pointer" : "not-allowed",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {appState.isPredicting ? "🛑 Detener Predicción" : "▶️ Iniciar Predicción"}
              </button>
            }
          />

          {/* 🔤 Overlay con la vocal detectada */}
          {appState.prediction && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "120px",
                fontWeight: "bold",
                color: "rgba(255,255,255,0.9)",
                textShadow: "0px 0px 20px rgba(0,0,0,0.7)",
                pointerEvents: "none",
              }}
            >
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
              <p>Confianza: {(appState.predictionConfidence * 100).toFixed(2)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
