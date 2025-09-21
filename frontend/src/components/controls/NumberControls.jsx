import React from 'react';
import './NumberControls.css'; // Nota: Ahora se usa un archivo de estilos con un nombre más apropiado
import ActionButtons from "../common/ActionButtons.jsx";

const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const SAMPLES_PER_NUMBER = 100;

const NumberControls = ({
  progress,
  isCollecting,
  currentNumber,
  startCollecting,
  stopCollecting,
  deleteNumberData,
  canTrain,
  isTraining,
  trainModel,
  resetData
}) => {
  return (
    <div className="number-controls">
      {NUMBERS.map(number => {
        const numberProgress = progress[number] || { count: 0, max: SAMPLES_PER_NUMBER, percentage: 0 };
        const count = numberProgress.count;
        const percentage = numberProgress.percentage;
        const isComplete = count >= SAMPLES_PER_NUMBER;
        const isCurrentlyCollecting = isCollecting && currentNumber === number;

        return (
          <div key={number} className="number-item">
            <div className="number-header">
              <span className="number-label">Número '{number}'</span>
              <span className="sample-count">
                {count}/{SAMPLES_PER_NUMBER}
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
        );
      })}

      <div className="number-item action-buttons-wrapper">
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

export default NumberControls;