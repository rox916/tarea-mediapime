export default function TrainingAlgorithmsNumbers() {
  const numbers = Array.from({ length: 10 }, (_, i) => i); // 0–9

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🔢 Entrenamiento de Números</h1>
      <p>Aquí podrás entrenar modelos para los números del 0 al 9:</p>
      <div style={{ marginTop: "1rem" }}>
        {numbers.map((n) => (
          <button 
            key={n} 
            style={{ margin: "0.5rem", padding: "1rem 2rem", fontSize: "1.2rem" }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
