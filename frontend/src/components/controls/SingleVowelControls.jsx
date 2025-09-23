import React from "react";
import ActionButtons from "../common/ActionButtons.jsx";
import StatusMessage from "../feedback/StatusMessage.jsx";

const SAMPLES_PER_VOWEL = 100;

export default function SingleVowelControls({
  vowel,
  progress,
  isCollecting,
  currentVowel,
  startCollecting,
  stopCollecting,
  deleteVowelData,
  canTrain,
  isTraining,
  trainModel,
  resetData,
  statusMessage
}) {
  const vowelProgress = progress[vowel] || { count: 0, percentage: 0 };
  const count = vowelProgress.count;
  const percentage = vowelProgress.percentage;
  const isComplete = count >= SAMPLES_PER_VOWEL;
  const isCurrentlyCollecting = isCollecting && currentVowel === vowel;

  return (
    <div className="controls-section">
      <h2>🎛️ Entrenamiento de la vocal {vowel}</h2>

      {/* Progreso de la vocal */}
      <div className="vowel-item">
        <div className="vowel-header">
          <span className="vowel-label">Vocal '{vowel}'</span>
          <span className="sample-count">
            {count}/{SAMPLES_PER_VOWEL}
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
              isCurrentlyCollecting ? stopCollecting() : startCollecting(vowel);
            }
          }}
          disabled={isComplete}
        >
          {isComplete
            ? `Vocal '${vowel}' Completa`
            : isCurrentlyCollecting
            ? `Detener Recolección '${vowel}'`
            : `Recolectar '${vowel}' (${count}/${SAMPLES_PER_VOWEL})`}
        </button>

        {count > 0 && (
          <button
            className="delete-btn"
            onClick={() => deleteVowelData(vowel)}
            disabled={isCurrentlyCollecting && !isComplete}
            title={`Eliminar datos de la vocal '${vowel}'`}
          >
            🗑️ Eliminar '{vowel}'
          </button>
        )}
      </div>

      {/* Botones generales */}
      <div className="action-buttons-wrapper">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain}   // ✅ ya es un booleano
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
