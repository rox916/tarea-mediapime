// src/components/camera/PredictionCameraSection.jsx
import React from "react";
import "../../styles/PredictionCameraSection.css";

export default function PredictionCameraSection({
  videoRef,
  canvasRef,
  isInitialized,
  error,
  actionsSlot,
}) {
  return (
    <div className="prediction-camera">
      <h2>📷 Cámara</h2>

      {error && <p className="error">❌ {error}</p>}
      {!isInitialized && !error && <p className="loading">🔄 Inicializando...</p>}

      <div className="camera-container">
        <video ref={videoRef} className="camera-feed" autoPlay muted playsInline />
        <canvas ref={canvasRef} className="canvas-overlay" />
      </div>

      {/* Botón de acción (predicción) */}
      <div className="prediction-actions">{actionsSlot}</div>
    </div>
  );
}
