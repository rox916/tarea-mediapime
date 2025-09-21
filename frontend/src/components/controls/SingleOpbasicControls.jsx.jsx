import React from "react";
import ActionButtons from "../common/ActionButtons.jsx";
import StatusMessage from "../feedback/StatusMessage.jsx";

const SAMPLES_PER_opbasic = 100;

export default function SingleopbasicControls({
  opbasic,
  progress,
  isCollecting,
  currentopbasic,
  startCollecting,
  stopCollecting,
  deleteopbasicData,
  canTrain,
  isTraining,
  trainModel,
  resetData,
  statusMessage
}) {
  const opbasicProgress = progress[opbasic] || { count: 0, percentage: 0 };
  const count = opbasicProgress.count;
  const percentage = opbasicProgress.percentage;
  const isComplete = count >= SAMPLES_PER_opbasic;
  const isCurrentlyCollecting = isCollecting && currentopbasic === opbasic;

  return (
    <div className="controls-section">
      <h2>🎛️ Entrenamiento de la operacion {opbasic}</h2>

      {/* Progreso de la vocal */}
      <div className="opbasic-item">
        <div className="opbasic-header">
          <span className="opbasic-label">operacion de '{opbasic}'</span>
          <span className="sample-count">
            {count}/{SAMPLES_PER_opbasic}
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
              isCurrentlyCollecting ? stopCollecting() : startCollecting(opbasic);
            }
          }}
          disabled={isComplete}
        >
          {isComplete
            ? `Operacion de '${opbasic}' Completa`
            : isCurrentlyCollecting
            ? `Detener Recolección de '${opbasic}'`
            : `Recolectar '${opbasic}' (${count}/${SAMPLES_PER_opbasic})`}
        </button>

        {count > 0 && (
          <button
            className="delete-btn"
            onClick={() => deleteopbasicData(opbasic)}
            disabled={isCurrentlyCollecting && !isComplete}
            title={`Eliminar datos de la vocal '${opbasic}'`}
          >
            🗑️ Eliminar '{opbasic}'
          </button>
        )}
      </div>

      {/* Botones generales */}
      <div className="action-buttons-wrapper">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain()}
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
