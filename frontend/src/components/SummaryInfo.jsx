import React from 'react';

const SummaryInfo = ({ getTotalSamples, getRequiredSamples }) => {
  return (
    <div className="summary-info">
      <h3>Progreso General</h3>
      <div className="summary-stats">
        <div className="stat-item">
          <div className="stat-number">{getTotalSamples()}</div>
          <div className="stat-label">Muestras Recolectadas</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{getRequiredSamples() - getTotalSamples()}</div>
          <div className="stat-label">Muestras Faltantes</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{Math.round((getTotalSamples() / getRequiredSamples()) * 100)}%</div>
          <div className="stat-label">Completado</div>
        </div>
      </div>
    </div>
  );
};

export default SummaryInfo;