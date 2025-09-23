import React from "react";
import { Link, Outlet } from "react-router-dom";
import {
  FaBook,
  FaCalculator,
  FaListOl,
  FaBrain,
  FaChartBar,
} from "react-icons/fa";

import "../../styles/Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>
            <FaBrain /> GestuAI   
          </h2>
        </div>

        {/* Entrenamiento */}
        <p className="sidebar-section">Entrenamiento</p>
        <ul className="sidebar-nav">
          <li>
            <Link to="/training/words/vowels">
              <FaBook className="icon" />
              <span>Vocales</span>
            </Link>
          </li>
          <li>
            <Link to="/training/algorithms/numbers">
              <FaListOl className="icon" />
              <span>Números</span>
            </Link>
          </li>
          <li>
            <Link to="/training/algorithms/opbasic">
              <FaCalculator className="icon" />
              <span>Operaciones</span>
            </Link>
          </li>
        </ul>

        {/* Predicciones */}
        <p className="sidebar-section">Predicciones</p>
        <ul className="sidebar-nav">
          <li>
            <Link to="/predictions">
              <FaBrain className="icon" />
              <span>Predicciones</span>
            </Link>
          </li>
          <li>
            <Link to="/predictions/words">
              <FaBook className="icon" />
              <span>Palabras</span>
            </Link>
          </li>
          <li>
            <Link to="/predictions/algorithms">
              <FaCalculator className="icon" />
              <span>Algoritmos</span>
            </Link>
          </li>
        </ul>
      </aside>

      {/* Contenido principal */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
