// src/pages/Predictions/PredictionsAlgorithms.jsx
import React, { useRef } from "react";
import { useMediaPipeTasks } from "../../hooks/useMediaPipeTasks.js";
import PredictionCameraSection from "../../components/camera/PredictionCameraSection.jsx";

export default function PredictionsAlgorithms() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Solo cámara: no hacemos predicción aún
  const { isInitialized, error } = useMediaPipeTasks({
    videoRef,
    canvasRef,
    isPredicting: false,    // no procesamos frames
    isModelTrained: true,   // para no bloquear el UI del componente
    onPredict: () => {},    // no-op por ahora
  });

  return (
    <div className="training-container">
      <div className="training-main">
        <h2 className="prediction-title">🧮 Predicción de Algoritmos</h2>
        <p className="prediction-subtitle">
          Por ahora solo mostramos la cámara. Luego aquí combinaremos números y operaciones.
        </p>

        <div className="camera-card">
          <PredictionCameraSection
            videoRef={videoRef}
            canvasRef={canvasRef}
            isInitialized={isInitialized}
            error={error}
            // actionsSlot es opcional; si tu componente lo requiere, puedes pasar null:
            // actionsSlot={null}
          />
        </div>
      </div>
    </div>
  );
}
