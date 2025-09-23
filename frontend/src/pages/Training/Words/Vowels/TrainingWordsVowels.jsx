import React from "react";
import { Link } from "react-router-dom";
import { FaA, FaE, FaI, FaO, FaU } from "react-icons/fa6";
import "../../../../styles/SelectionGrid.css";

export default function TrainingWordsVowels() {
  const vowels = [
    { label: "A", path: "/training/words/vowels/a", icon: <FaA /> },
    { label: "E", path: "/training/words/vowels/e", icon: <FaE /> },
    { label: "I", path: "/training/words/vowels/i", icon: <FaI /> },
    { label: "O", path: "/training/words/vowels/o", icon: <FaO /> },
    { label: "U", path: "/training/words/vowels/u", icon: <FaU /> },
  ];

  return (
    <div className="selection-container">
      <h2>🔡 Entrenamiento de Vocales</h2>
      <p>Selecciona la vocal que deseas entrenar:</p>

      <div className="selection-grid">
        {vowels.map((v) => (
          <Link to={v.path} key={v.label} style={{ textDecoration: "none" }}>
            <div className="selection-card">
              <div className="icon">{v.icon}</div>
              <span>{v.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="selection-footer">
        👆 Selecciona una vocal para comenzar tu entrenamiento
      </div>
    </div>
  );
}
