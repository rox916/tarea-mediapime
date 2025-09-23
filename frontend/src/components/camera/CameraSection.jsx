import React from "react";
import "../../styles/CameraSection.css";

const CameraSection = React.memo(function CameraSection({
  videoRef,
  canvasRef,
  isInitialized,
  error,
  actionsSlot,
  progress = 0, // 👈 nuevo prop (0–100)
}) {
  return (
    <div className="camera-section">
      <h2>📷 Cámara</h2>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <p>Por favor, verifica los permisos de la cámara.</p>
        </div>
      )}

      {!isInitialized && !error && (
        <div className="loading-message">
          <p>🔄 Inicializando cámara y modelo...</p>
        </div>
      )}

      <div className="camera-container">
        <video
          ref={videoRef}
          className="camera-feed"
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="canvas-overlay" />
      </div>

      {/* Barra de progreso */}
      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="progress-text">{Math.round(progress)}%</p>

      {/* Footer: pasos (izq) + botones (der) */}
      <div className="camera-footer">
        <div className="training-steps">
          <h3>📘 Pasos de Entrenamiento</h3>
          <ol>
            <li>Haz clic en “Recolectar”.</li>
            <li>Repite hasta llegar al 100%.</li>
            <li>Entrena el modelo.</li>
          </ol>
        </div>

        <div className="camera-actions">
          {actionsSlot /* ← Botones inyectados por el padre */}
        </div>
      </div>
    </div>
  );
});

export default CameraSection;
