import React from 'react';

const ActionButtons = ({ 
  isCollecting, 
  canTrain, 
  isTraining, 
  stopCollecting, 
  trainModel, 
  resetData 
}) => {
  return (
    <div className="action-buttons">
      {isCollecting && (
        <button className="action-btn stop-btn" onClick={stopCollecting}>
          🛑 Detener Recolección
        </button>
      )}
      
      <button
        className="action-btn train-btn"
        onClick={trainModel}
        disabled={!canTrain() || isTraining}
      >
        {isTraining ? (
          <>
            <span className="loading"></span>
            Entrenando Modelo...
          </>
        ) : (
          '🧠 Entrenar Modelo'
        )}
      </button>
      
      <button className="action-btn reset-btn" onClick={resetData}>
        🔄 Reiniciar Datos
      </button>
    </div>
  );
};

export default ActionButtons;