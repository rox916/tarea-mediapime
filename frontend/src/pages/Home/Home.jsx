// src/pages/Home.jsx
import { FaBrain, FaChalkboardTeacher } from "react-icons/fa";
import "../../styles/Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        {/* Título principal */}
        <h1 className="home-title">👋 Bienvenido al Sistema de Reconocimiento de Gestos</h1>
        <p className="home-subtitle">
          Esta plataforma utiliza inteligencia artificial para entrenar y predecir gestos
          basados en expresiones y movimientos, permitiendo explorar el aprendizaje
          automático de manera interactiva y educativa.
        </p>

        {/* Sección de características */}
        <div className="home-features">
          <div className="feature-card">
            <FaChalkboardTeacher className="feature-icon" />
            <h3>Entrenamientos</h3>
            <p>
              Crea y entrena modelos con vocales, números y operaciones matemáticas. 
              Aprende cómo la IA interpreta tus gestos.
            </p>
          </div>

          <div className="feature-card">
            <FaBrain className="feature-icon" />
            <h3>Predicciones</h3>
            <p>
              Pon a prueba los modelos entrenados y observa cómo el sistema reconoce
              tus gestos en tiempo real.
            </p>
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div className="home-footer">
          🌟 <em>"Aprende, entrena y descubre el poder de la inteligencia artificial aplicada a los gestos."</em>
        </div>
      </div>
    </div>
  );
}
