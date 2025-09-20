import React from 'react';

const StatusMessage = ({ statusMessage }) => {
  const getStatusMessageClass = () => {
    if (statusMessage.includes('Error') || statusMessage.includes('error')) {
      return 'error';
    }
    if (statusMessage.includes('completado') || statusMessage.includes('Entrenamiento')) {
      return 'success';
    }
    return 'info';
  };

  if (!statusMessage) return null;

  return (
    <div className={`status-message ${getStatusMessageClass()}`}>
      {statusMessage}
    </div>
  );
};

export default StatusMessage;