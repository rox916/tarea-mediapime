import React from 'react';
import './CameraSection.css';

const CameraSection = React.memo(({ 
  videoRef, 
  canvasRef, 
  isModelTrained, 
  isPredicting, 
  prediction, 
  predictionConfidence,
  togglePrediction,
  isInitialized,
  isCameraReady,
  error
}) => {
  return (
    <div className="camera-section">
      <h2>📹 Cámara</h2>
      
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <p>Por favor, asegúrate de que tu navegador tenga permisos para acceder a la cámara.</p>
        </div>
      )}
      
      {!isInitialized && !error && (
        <div className="loading-message">
          <p>🔄 Inicializando cámara y MediaPipe...</p>
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
        <canvas 
            ref={canvasRef} 
            className="canvas-overlay"
            style={{ display: isCameraReady && !error ? 'block' : 'none' }}
          />
      </div>

      {isModelTrained && isInitialized && !error && (
        <div className="prediction-section">
          <div className="prediction-controls">
            <button 
              onClick={togglePrediction}
              className={`prediction-toggle ${isPredicting ? 'active' : ''}`}
            >
              {isPredicting ? '⏸️ Pausar Predicción' : '▶️ Iniciar Predicción'}
            </button>
          </div>
          
          {isPredicting && (
            <div className="prediction-display">
              <h3>Predicción:</h3>
              <div className="prediction-result">
                {prediction || 'Muestra tu mano...'}
              </div>
              {prediction && predictionConfidence && (
                <div className="prediction-confidence">
                  Confianza: {(predictionConfidence * 100).toFixed(1)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Función de comparación para React.memo - evita re-renders innecesarios
CameraSection.displayName = 'CameraSection';

export default CameraSection;