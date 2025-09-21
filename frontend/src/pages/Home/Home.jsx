// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-container" style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Reconocimiento de Gestos</h1>
      <p>Bienvenido 👋. Elige qué deseas hacer:</p>

      <div style={{ marginTop: "2rem" }}>
        <Link to="/training">
          <button style={{ margin: "1rem", padding: "1rem 2rem", fontSize: "1.2rem" }}>
            Entrenamientos
          </button>
        </Link>

        <Link to="/predictions">
          <button style={{ margin: "1rem", padding: "1rem 2rem", fontSize: "1.2rem" }}>
            Predicciones
          </button>
        </Link>
      </div>
    </div>
  );
}
