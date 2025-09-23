import { Link } from "react-router-dom";
import { FaTimes, FaDivide, FaMinus, FaPlus } from "react-icons/fa";
import "../../../../styles/SelectionGrid.css"; // el mismo estilo que vocales y números

export default function TrainingAlgorithmsBasic() {
  const opbasic = [
    { name: "Multiplicación", key: "multiplicacion", icon: <FaTimes /> },
    { name: "División", key: "division", icon: <FaDivide /> },
    { name: "Resta", key: "menos", icon: <FaMinus /> },
    { name: "Suma", key: "mas", icon: <FaPlus /> },
  ];

  return (
    <div className="selection-container">
      {/* Título */}
      <h2>
        <FaDivide style={{ color: "#6c63ff" }} />
        Operaciones Básicas
      </h2>
      <p>Aquí podrás entrenar modelos para las operaciones matemáticas:</p>

      {/* Grid */}
      <div className="selection-grid">
        {opbasic.map((op) => (
          <Link
            key={op.key}
            to={`/training/algorithms/opbasic/${op.key}`}
            style={{ textDecoration: "none" }}
          >
            <div className="selection-card">
              <div className="icon">{op.icon}</div>
              <span>{op.name}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="selection-footer">
        👉 Selecciona una operación para comenzar tu entrenamiento
      </div>
    </div>
  );
}
