import { Link } from "react-router-dom";

export default function TrainingAlgorithms() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🧮 Entrenamiento de Algoritmos</h1>
      <p>Esta sección está en construcción.</p>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/training/Algorithms/opbasic">
          <button style={{ margin: "1rem", padding: "1rem 2rem" }}>Operaciones Basicas</button>
        </Link>

        <Link to="/training/Algorithms/numbers">
          <button style={{ margin: "1rem", padding: "1rem 2rem" }}>Numeros Unitarios</button>
        </Link>
      </div>
    </div>
  );
}
