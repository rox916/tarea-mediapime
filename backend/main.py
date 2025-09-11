from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import json
import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
from datetime import datetime

app = FastAPI(title="Vocal Recognition API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos de datos
class LandmarkData(BaseModel):
    vowel: str  # A, E, I, O, U
    landmarks: List[List[float]]  # Array de 21 puntos [x, y, z]
    timestamp: str = None

class PredictionRequest(BaseModel):
    landmarks: List[List[float]]

# Variables globales
DATA_DIR = "data_storage"
MODELS_DIR = "models"
VOCALS = ["A", "E", "I", "O", "U"]
MAX_SAMPLES = 100

# Crear directorios si no existen
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Funciones auxiliares
def load_data():
    """Carga todos los datos guardados"""
    data = {vocal: [] for vocal in VOCALS}
    
    for vocal in VOCALS:
        file_path = os.path.join(DATA_DIR, f"{vocal.lower()}_samples.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                data[vocal] = json.load(f)
    
    return data

def save_sample(vocal: str, landmarks: List[List[float]], timestamp: str):
    """Guarda una muestra de landmarks"""
    file_path = os.path.join(DATA_DIR, f"{vocal.lower()}_samples.json")
    
    # Cargar datos existentes
    samples = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            samples = json.load(f)
    
    # Añadir nueva muestra
    sample = {
        "landmarks": landmarks,
        "timestamp": timestamp
    }
    samples.append(sample)
    
    # Limitar a MAX_SAMPLES
    if len(samples) > MAX_SAMPLES:
        samples = samples[-MAX_SAMPLES:]
    
    # Guardar
    with open(file_path, 'w') as f:
        json.dump(samples, f, indent=2)

def get_progress():
    """Obtiene el progreso de recolección"""
    progress = {}
    
    for vocal in VOCALS:
        file_path = os.path.join(DATA_DIR, f"{vocal.lower()}_samples.json")
        count = 0
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                data = json.load(f)
                count = len(data)
        
        progress[vocal] = {
            "count": count,
            "max": MAX_SAMPLES,
            "percentage": (count / MAX_SAMPLES) * 100
        }
    
    return progress

def prepare_training_data():
    """Prepara los datos para entrenamiento"""
    data = load_data()
    
    X = []
    y = []
    
    for vocal in VOCALS:
        samples = data[vocal]
        for sample in samples:
            # Aplanar los landmarks (21 puntos * 3 coordenadas = 63 features)
            landmarks_flat = np.array(sample["landmarks"]).flatten()
            X.append(landmarks_flat)
            y.append(vocal)
    
    return np.array(X), np.array(y)

# Endpoints
@app.get("/")
async def root():
    return {"message": "Vocal Recognition API", "status": "running"}

@app.post("/api/samples")
async def add_sample(data: LandmarkData):
    """Recibe y guarda una muestra de landmarks"""
    try:
        print(f"Recibiendo datos: vocal={data.vowel}, landmarks_len={len(data.landmarks)}")
        
        # Validar vocal
        if data.vowel.upper() not in VOCALS:
            raise HTTPException(status_code=400, detail="Vocal inválida")
        
        # Verificar si ya se alcanzó el límite
        current_progress = get_progress()
        vowel_upper = data.vowel.upper()
        if current_progress[vowel_upper]["count"] >= MAX_SAMPLES:
            raise HTTPException(status_code=400, detail=f"Ya se alcanzó el límite de {MAX_SAMPLES} muestras para la vocal '{vowel_upper}'")
        
        # Validar landmarks (21 puntos con 3 coordenadas cada uno)
        if len(data.landmarks) != 21 or any(len(point) != 3 for point in data.landmarks):
            raise HTTPException(status_code=400, detail="Landmarks inválidos")
        
        # Timestamp
        timestamp = data.timestamp or datetime.now().isoformat()
        
        # Guardar muestra
        save_sample(vowel_upper, data.landmarks, timestamp)
        
        # Obtener progreso actualizado
        progress = get_progress()
        
        return {
            "message": f"Muestra de '{vowel_upper}' guardada",
            "progress": progress[vowel_upper]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en add_sample: {str(e)}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/api/progress")
async def get_collection_progress():
    """Devuelve el progreso de recolección de todas las vocales"""
    try:
        print("Obteniendo progreso...")
        progress = get_progress()
        print(f"Progreso obtenido: {progress}")
        
        # Calcular progreso total
        total_samples = sum(p["count"] for p in progress.values())
        total_max = len(VOCALS) * MAX_SAMPLES
        total_percentage = (total_samples / total_max) * 100
        
        return {
            "vocals": progress,
            "total": {
                "samples": total_samples,
                "max": total_max,
                "percentage": total_percentage
            }
        }
    except Exception as e:
        print(f"Error en get_collection_progress: {str(e)}")
        print(f"Tipo de error: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/api/train")
async def train_model():
    """Entrena el modelo de clasificación"""
    try:
        # Verificar que hay suficientes datos
        progress = get_progress()
        insufficient_data = [vocal for vocal, data in progress.items() if data["count"] < MAX_SAMPLES]
        
        if insufficient_data:
            raise HTTPException(
                status_code=400, 
                detail=f"Datos insuficientes para: {', '.join(insufficient_data)}"
            )
        
        # Preparar datos
        X, y = prepare_training_data()
        
        if len(X) == 0:
            raise HTTPException(status_code=400, detail="No hay datos para entrenar")
        
        # Codificar etiquetas
        label_encoder = LabelEncoder()
        y_encoded = label_encoder.fit_transform(y)
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        # Crear modelo
        model = keras.Sequential([
            keras.layers.Dense(128, activation='relu', input_shape=(63,)),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(len(VOCALS), activation='softmax')
        ])
        
        # Compilar modelo
        model.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Entrenar modelo
        history = model.fit(
            X_train, y_train,
            epochs=50,
            batch_size=32,
            validation_data=(X_test, y_test),
            verbose=0
        )
        
        # Evaluar modelo
        test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
        
        # Guardar modelo y encoder
        model_path = os.path.join(MODELS_DIR, "vocales_model.h5")
        encoder_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
        
        model.save(model_path)
        joblib.dump(label_encoder, encoder_path)
        
        return {
            "message": "Entrenamiento completado ✅",
            "accuracy": float(test_accuracy),
            "loss": float(test_loss),
            "samples_used": len(X),
            "model_saved": model_path
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def predict_vocal(data: PredictionRequest):
    """Predice la vocal basada en landmarks"""
    try:
        # Verificar que el modelo existe
        model_path = os.path.join(MODELS_DIR, "vocales_model.h5")
        encoder_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
        
        if not os.path.exists(model_path) or not os.path.exists(encoder_path):
            raise HTTPException(status_code=400, detail="Modelo no entrenado")
        
        # Cargar modelo y encoder
        model = keras.models.load_model(model_path)
        label_encoder = joblib.load(encoder_path)
        
        # Validar landmarks
        if len(data.landmarks) != 21 or any(len(point) != 3 for point in data.landmarks):
            raise HTTPException(status_code=400, detail="Landmarks inválidos")
        
        # Preparar datos
        landmarks_flat = np.array(data.landmarks).flatten().reshape(1, -1)
        
        # Predecir
        predictions = model.predict(landmarks_flat, verbose=0)
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        
        # Decodificar etiqueta
        predicted_vocal = label_encoder.inverse_transform([predicted_class])[0]
        
        return {
            "prediction": predicted_vocal,
            "confidence": confidence,
            "all_probabilities": {
                vocal: float(predictions[0][i]) 
                for i, vocal in enumerate(label_encoder.classes_)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset")
async def reset_data():
    """Reinicia todos los datos de recolección"""
    try:
        # Eliminar archivos de datos
        for vocal in VOCALS:
            file_path = os.path.join(DATA_DIR, f"{vocal.lower()}_samples.json")
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Eliminar modelo entrenado
        model_path = os.path.join(MODELS_DIR, "vocales_model.h5")
        encoder_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
        
        if os.path.exists(model_path):
            os.remove(model_path)
        if os.path.exists(encoder_path):
            os.remove(encoder_path)
        
        return {
            "message": "Datos reiniciados correctamente",
            "progress": get_progress()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8002)