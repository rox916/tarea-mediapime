import React from "react";
import "./LeftBox.css";

const LeftBox = () => {
  return (
    <aside className="left-box">
      <h2>📑 Pasos de Entrenamiento</h2>
      <ol className="steps-list">
        <li>Selecciona la vocal a recolectar.</li>
        <li>Haz clic en "Recolectar" hasta llegar a tu meta.</li>
        <li>Repite para cada vocal (A, E, I, O, U).</li>
        <li>Cuando todas estén al 100%, pulsa "Entrenar Modelo".</li>
        <li>Espera a que termine y revisa el mensaje de confirmación.</li>
      </ol>
      <p className="tip">
        💡 Tip: Si cometiste un error, puedes eliminar el dato y volverlo a intentar. No es necesario reiniciar todo.".
      </p>
    </aside>
  );
};

export default LeftBox;
