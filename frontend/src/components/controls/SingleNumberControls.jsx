import React from "react";
import ActionButtons from "../common/ActionButtons.jsx";
import StatusMessage from "../feedback/StatusMessage.jsx";

const SAMPLES_PER_NUMBER = 100;

export default function SingleNumberControls({
  number,
  progress,
  isCollecting,
  currentNumber,
  startCollecting,
  stopCollecting,
  deleteNumberData,
  canTrain,
  isTraining,
  trainModel,
  resetData,
  statusMessage
}) {
  const numberProgress = progress[number] || { count: 0, percentage: 0 };
  const count = numberProgress.count;
  const percentage = numberProgress.percentage;
  const isComplete = count >= SAMPLES_PER_NUMBER;
  const isCurrentlyCollecting = isCollecting && currentNumber === number;

  return (
    <div className="controls-section">
      <h2>🎛️ Entrenamiento del número {number}</h2>

      {/* Progreso del número */}
      <div className="number-item">
        <div className="number-header">
          <span className="number-label">Número '{number}'</span>
          <span className="sample-count">
            {count}/{SAMPLES_PER_NUMBER}
            {isComplete && " ✅"}
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <button
          className={`collect-btn 
            ${isCurrentlyCollecting ? "active" : ""} 
            ${isComplete ? "complete" : ""}`}
          onClick={() => {
            if (!isComplete) {
              isCurrentlyCollecting ? stopCollecting() : startCollecting(number);
            }
          }}
          disabled={isComplete}
        >
          {isComplete
            ? `Número '${number}' Completo`
            : isCurrentlyCollecting
            ? `Detener Recolección '${number}'`
            : `Recolectar '${number}' (${count}/${SAMPLES_PER_NUMBER})`}
        </button>

        {count > 0 && (
          <button
            className="delete-btn"
            onClick={() => deleteNumberData(number)}
            disabled={isCurrentlyCollecting && !isComplete}
            title={`Eliminar datos del número '${number}'`}
          >
            🗑️ Eliminar '{number}'
          </button>
        )}
      </div>

      {/* Botones generales */}
      <div className="action-buttons-wrapper">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain}   // 👈 ahora ya no lleva ()
          isTraining={isTraining}
          stopCollecting={stopCollecting}
          trainModel={trainModel}
          resetData={resetData}
        />

      </div>

      {/* Mensaje de estado */}
      <StatusMessage message={statusMessage} />
    </div>
  );
}