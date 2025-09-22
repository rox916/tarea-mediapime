import SingleNumberControls from "../../../../components/controls/SingleNumberControls.jsx";
import { useNumberLogic } from "../../../../hooks/useNumberLogic.js";
import { useState } from "react";

export default function TrainingAlgorithmsNumber1() {   // 👈 cambia X por el número
  const [modalData, setModalData] = useState({ open: false, message: "" });
  const {
    appState,
    startCollecting,
    stopCollecting,
    trainModel,
    resetData,
    deleteNumberData,
    togglePrediction,
    handleLandmarks,
    handlePredict,
    canTrain
  } = useNumberLogic({ setModalData });

  return (
    <SingleNumberControls
      number={1}   // 👈 aquí también cambia X por el número
      progress={appState.numberProgress}
      isCollecting={appState.isCollecting}
      currentNumber={appState.currentNumber}
      startCollecting={startCollecting}
      stopCollecting={stopCollecting}
      deleteNumberData={deleteNumberData}
      canTrain={canTrain}   // ✅ ahora ya es booleano
      isTraining={appState.isTraining}
      trainModel={trainModel}
      resetData={resetData}
      statusMessage={appState.statusMessage}
    />
  );
}
