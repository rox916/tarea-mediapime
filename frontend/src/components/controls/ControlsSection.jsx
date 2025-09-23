import React from 'react';
import "../../styles/CameraSection.css";

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
  error,
  isCollecting,
  startCollecting,
  stopCollecting,
  trainModel,
  resetData
}) => {
  return (
    <div className="camera-section">
      <h2>📹 Cámara</h2>
      
      {/* Mensajes de error e inicialización */}
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
      
      {/* Contenedor de video + canvas */}
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

      {/* Predicción */}
      <div className="prediction-row">
        {isModelTrained && isInitialized && !error && (
          <button 
            onClick={togglePrediction}
            className={`prediction-toggle ${isPredicting ? 'active' : ''}`}
          >
            {isPredicting ? '⏸️ Pausar Predicción' : '▶️ Iniciar Predicción'}
          </button>
        )}

        <div className="prediction-display">
          {isPredicting ? (
            <>
              <h3>Predicción</h3>
              <div className="prediction-letter">
                {prediction || '...'}
              </div>
              {prediction && predictionConfidence && (
                <div className="prediction-confidence">
                  Confianza: {(predictionConfidence * 100).toFixed(1)}%
                </div>
              )}
            </>
          ) : (
            <p>Predicción inactiva</p>
          )}
        </div>
      </div>

      {/* 🔹 Botones de acción dentro de la tarjeta */}
      <div className="camera-actions">
        {isCollecting ? (
          <button className="action-btn stop-btn" onClick={stopCollecting}>
            ⏸️ Detener Recolección
          </button>
        ) : (
          <button className="action-btn collect-btn" onClick={() => startCollecting("a")}>
            🎤 Recolectar 'A'
          </button>
        )}

        <button 
          className="action-btn train-btn" 
          onClick={trainModel}
          disabled={!isModelTrained && !isCollecting}  
        >
          🧠 Entrenar Modelo
        </button>

        <button className="action-btn reset-btn" onClick={resetData}>
          🔄 Reiniciar Datos
        </button>
      </div>
    </div>
  );
});

CameraSection.displayName = 'CameraSection';

export default CameraSection;
