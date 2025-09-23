import React from "react";
import ActionButtons from "../common/ActionButtons.jsx";
import StatusMessage from "../feedback/StatusMessage.jsx";

const SAMPLES_PER_OPBASIC = 100;

export default function BasicOperationControls({
  opbasic,
  progress,
  isCollecting,
  currentOpbasic,
  startCollecting,
  stopCollecting,
  deleteOpbasicData,
  canTrain,
  isTraining,
  trainModel,
  resetData,
  statusMessage,
}) {
  const opbasicProgress = progress?.[opbasic] || { count: 0, percentage: 0 };
  const count = opbasicProgress.count || 0;
  const percentage = opbasicProgress.percentage || 0;
  const isComplete = count >= SAMPLES_PER_OPBASIC;
  const isCurrentlyCollecting = isCollecting && currentOpbasic === opbasic;

  return (
    <div className="controls-section">
      <h2>🎛️ Entrenamiento de la operación {opbasic}</h2>

      <div className="opbasic-item">
        <div className="opbasic-header">
          <span className="opbasic-label">Operación: '{opbasic}'</span>
          <span className="sample-count">
            {count}/{SAMPLES_PER_OPBASIC}
            {isComplete && " ✅"}
          </span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>

        <button
          className={`collect-btn 
            ${isCurrentlyCollecting ? "active" : ""} 
            ${isComplete ? "complete" : ""}`}
          onClick={() => {
            if (!isComplete) {
              isCurrentlyCollecting
                ? stopCollecting()
                : startCollecting(opbasic);
            }
          }}
          disabled={isComplete}
        >
          {isComplete
            ? `Operación '${opbasic}' completa`
            : isCurrentlyCollecting
            ? `Detener recolección de '${opbasic}'`
            : `Recolectar '${opbasic}' (${count}/${SAMPLES_PER_OPBASIC})`}
        </button>

        {count > 0 && (
          <button
            className="delete-btn"
            onClick={() => deleteOpbasicData(opbasic)}
            disabled={isCurrentlyCollecting && !isComplete}
            title={`Eliminar datos de la operación '${opbasic}'`}
          >
            🗑️ Eliminar '{opbasic}'
          </button>
        )}
      </div>

      <div className="action-buttons-wrapper">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain}
          isTraining={isTraining}
          stopCollecting={stopCollecting}
          trainModel={trainModel}
          resetData={resetData}
        />
      </div>

      <StatusMessage message={statusMessage} />
    </div>
  );
}
