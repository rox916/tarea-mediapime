import React from 'react';
import './opbasicControls.css';
import ActionButtons from "../common/ActionButtons.jsx";

const OPBASICS = [
  { key: "mas", label: "Suma", icon: "➕" },
  { key: "menos", label: "Resta", icon: "➖" },
  { key: "multipl", label: "Multiplicación", icon: "✖️" },
  { key: "division", label: "División", icon: "➗" }
];
const SAMPLES_PER_OPBASIC = 100;

const OpbasicControls = ({
  progress,
  isCollecting,
  currentopbasic,
  startCollecting,
  stopCollecting,
  deleteopbasicData,
  canTrain,
  isTraining,
  trainModel,
  resetData
}) => {
  return (
    <div className="vowel-controls">
      {OPBASICS.map(op => {
        const opProgress = progress[op.key] || { count: 0, max: SAMPLES_PER_OPBASIC, percentage: 0 };
        const count = opProgress.count;
        const percentage = opProgress.percentage;
        const isComplete = count >= SAMPLES_PER_OPBASIC;
        const isCurrentlyCollecting = isCollecting && currentopbasic === op.key;

        return (
          <div key={op.key} className="vowel-item">
            <div className="vowel-header">
              <span className="vowel-label">{op.icon} {op.label}</span>
              <span className="sample-count">
                {count}/{SAMPLES_PER_OPBASIC}
                {isComplete && ' ✅'}
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
                ${isCurrentlyCollecting ? 'active' : ''} 
                ${isComplete ? 'complete' : ''}`}
              onClick={() => {
                if (!isComplete) {
                  isCurrentlyCollecting ? stopCollecting() : startCollecting(op.key);
                }
              }}
              disabled={isComplete}
            >
              {isComplete
                ? `${op.label} Completa`
                : isCurrentlyCollecting
                  ? `Detener Recolección '${op.label}'`
                  : `Recolectar '${op.label}' (${count}/${SAMPLES_PER_OPBASIC})`}
            </button>

            {count > 0 && (
              <button
                className="delete-btn"
                onClick={() => deleteopbasicData(op.key)}
                disabled={isCurrentlyCollecting && !isComplete}
                title={`Eliminar datos de '${op.label}'`}
              >
                🗑️ Eliminar '{op.label}'
              </button>
            )}
          </div>
        );
      })}

      <div className="vowel-item action-buttons-wrapper">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain()}
          isTraining={isTraining}
          stopCollecting={stopCollecting}
          trainModel={trainModel}
          resetData={resetData}
        />
      </div>
    </div>
  );
};

export default OpbasicControls;