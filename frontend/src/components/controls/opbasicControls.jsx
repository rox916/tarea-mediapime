import React from "react";
import ActionButtons from "../common/ActionButtons.jsx";

const OPBASICS = ["mas", "menos", "multiplicacion", "division"];
const SAMPLES_PER_OPBASIC = 100;

const OpbasicControls = ({
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
}) => {
  return (
    <div className="camera-section">{/* 👈 contenedor general ya estilizado */}
      {OPBASICS.map((op) => {
        const opProgress =
          progress[op] || { count: 0, max: SAMPLES_PER_OPBASIC, percentage: 0 };
        const count = opProgress.count;
        const percentage = opProgress.percentage;
        const isComplete = count >= SAMPLES_PER_OPBASIC;
        const isCurrentlyCollecting = isCollecting && currentOpbasic === op;

        return (
          <div key={op} className="progress-container">
            <div className="progress-text">
              Operación: '{op}' {count}/{SAMPLES_PER_OPBASIC}
              {isComplete && " ✅"}
            </div>

            <div className="progress-bar" style={{ width: `${percentage}%` }} />

            <div className="camera-actions">
              <button
                className={`action-btn collect-btn`}
                onClick={() => {
                  if (!isComplete) {
                    isCurrentlyCollecting
                      ? stopCollecting()
                      : startCollecting(op);
                  }
                }}
                disabled={isComplete}
              >
                {isComplete
                  ? `Operación '${op}' completa`
                  : isCurrentlyCollecting
                  ? `Detener recolección de '${op}'`
                  : `Recolectar '${op}' (${count}/${SAMPLES_PER_OPBASIC})`}
              </button>

              {count > 0 && (
                <button
                  className="action-btn stop-btn"
                  onClick={() => deleteOpbasicData(op)}
                  disabled={isCurrentlyCollecting && !isComplete}
                  title={`Eliminar datos de la operación '${op}'`}
                >
                  🗑️ Eliminar '{op}'
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* 👇 Botones generales al final */}
      <div className="camera-actions">
        <ActionButtons
          isCollecting={isCollecting}
          canTrain={canTrain}
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
