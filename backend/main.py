from fastapi import FastAPI, HTTPException, BackgroundTasks
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
import asyncio

app = FastAPI(title="API de Reconocimiento de Vocales", version="1.0.0")

# Configurar CORS para permitir peticiones desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Modelos de datos para la API ---
class DatosMuestra(BaseModel):
    """Modelo para los datos de una muestra (una vocal con sus puntos clave)."""
    vocal: str
    puntos_clave: List[List[float]]
    fecha_hora: str = None

class SolicitudPrediccion(BaseModel):
    """Modelo para la solicitud de predicción (solo los puntos clave)."""
    puntos_clave: List[List[float]]

# --- Variables globales y configuración ---
DIR_DATOS = "data_storage"
DIR_MODELOS = "models"
VOCALES = ["A", "E", "I", "O", "U"]
MAX_MUESTRAS = 100

# Cola de muestras en memoria para guardar de forma asíncrona
cola_muestras: Dict[str, List[dict]] = {vocal: [] for vocal in VOCALES}
esta_guardando = {vocal: False for vocal in VOCALES} # Bandera para evitar escrituras simultáneas

# Crear directorios si no existen
os.makedirs(DIR_DATOS, exist_ok=True)
os.makedirs(DIR_MODELOS, exist_ok=True)

# --- Funciones auxiliares ---
def obtener_ruta_archivo(vocal: str):
    """Devuelve la ruta del archivo de datos para una vocal específica."""
    return os.path.join(DIR_DATOS, f"{vocal.lower()}_samples.json")

def cargar_datos_existentes():
    """Carga todos los datos de muestra guardados en el disco."""
    datos_cargados = {vocal: [] for vocal in VOCALES}
    for vocal in VOCALES:
        ruta_archivo = obtener_ruta_archivo(vocal)
        if os.path.exists(ruta_archivo):
            with open(ruta_archivo, 'r') as f:
                datos_cargados[vocal] = json.load(f)
    return datos_cargados

def guardar_cola_en_disco(vocal: str, datos_cola: List[dict]):
    """Guarda los datos de la cola en el archivo de forma segura y atómica."""
    ruta_temporal = obtener_ruta_archivo(vocal) + ".tmp"
    ruta_final = obtener_ruta_archivo(vocal)
    
    muestras_existentes = []
    if os.path.exists(ruta_final):
        with open(ruta_final, 'r') as f:
            muestras_existentes = json.load(f)
    
    # Combinar datos existentes con la cola y limitar a MAX_MUESTRAS
    todas_las_muestras = muestras_existentes + datos_cola
    if len(todas_las_muestras) > MAX_MUESTRAS:
        todas_las_muestras = todas_las_muestras[-MAX_MUESTRAS:]
    
    with open(ruta_temporal, 'w') as f:
        json.dump(todas_las_muestras, f, indent=2)
    
    os.replace(ruta_temporal, ruta_final)
    print(f"[{datetime.now()}] Muestras de '{vocal}' guardadas en disco. Total: {len(todas_las_muestras)}")

def obtener_progreso():
    """Calcula y devuelve el progreso de recolección de cada vocal."""
    progreso = {}
    for vocal in VOCALES:
        ruta_archivo = obtener_ruta_archivo(vocal)
        cantidad = 0
        if os.path.exists(ruta_archivo):
            with open(ruta_archivo, 'r') as f:
                datos = json.load(f)
                cantidad = len(datos)
        
        progreso[vocal] = {
            "cantidad": cantidad,
            "max": MAX_MUESTRAS,
            "porcentaje": (cantidad / MAX_MUESTRAS) * 100
        }
    return progreso

def preparar_datos_entrenamiento():
    """Prepara los datos recolectados para ser usados en el entrenamiento del modelo."""
    datos = cargar_datos_existentes()
    
    X = [] # Características (puntos clave aplanados)
    y = [] # Etiquetas (vocales)
    
    for vocal in VOCALES:
        muestras = datos[vocal]
        for muestra in muestras:
            # Aplanar los puntos clave (21 puntos * 3 coordenadas = 63 características)
            puntos_clave_aplanados = np.array(muestra["landmarks"]).flatten()
            X.append(puntos_clave_aplanados)
            y.append(vocal)
    return np.array(X), np.array(y)

# --- Endpoints de la API ---
@app.get("/")
async def raiz():
    """Endpoint principal de la API."""
    return {"mensaje": "API de Reconocimiento de Vocales", "estado": "funcionando"}

@app.post("/api/samples")
async def agregar_muestra(datos: DatosMuestra, tareas_fondo: BackgroundTasks):
    """Recibe y guarda una muestra de puntos clave en la cola de procesamiento."""
    vocal_mayus = datos.vocal.upper()
    
    progreso_actual = obtener_progreso()
    if progreso_actual[vocal_mayus]["cantidad"] + len(cola_muestras[vocal_mayus]) >= MAX_MUESTRAS:
        return {
            "mensaje": f"Ya se alcanzó el límite de {MAX_MUESTRAS} muestras para la vocal '{vocal_mayus}'",
            "progreso": progreso_actual[vocal_mayus]
        }
    
    fecha_hora = datos.fecha_hora or datetime.now().isoformat()
    muestra = {"landmarks": datos.puntos_clave, "fecha_hora": fecha_hora}
    cola_muestras[vocal_mayus].append(muestra)
    
    # Agregar la tarea de guardado si no hay una en curso
    if not esta_guardando[vocal_mayus]:
        tareas_fondo.add_task(tarea_guardar_cola_en_disco, vocal_mayus)
    
    return {
        "mensaje": f"Muestra de '{vocal_mayus}' añadida a la cola",
        "progreso": {
            "cantidad": progreso_actual[vocal_mayus]["cantidad"] + len(cola_muestras[vocal_mayus]),
            "max": MAX_MUESTRAS,
            "porcentaje": min(100, (progreso_actual[vocal_mayus]["cantidad"] + len(cola_muestras[vocal_mayus])) / MAX_MUESTRAS * 100)
        }
    }

async def tarea_guardar_cola_en_disco(vocal: str):
    """Tarea de fondo para guardar las muestras en lotes."""
    esta_guardando[vocal] = True
    try:
        # Esperar un poco para agrupar más muestras
        await asyncio.sleep(1) 
        
        cola_a_guardar = cola_muestras[vocal]
        cola_muestras[vocal] = [] # Limpiar la cola en memoria
        
        if cola_a_guardar:
            guardar_cola_en_disco(vocal, cola_a_guardar)
    finally:
        esta_guardando[vocal] = False

@app.get("/api/progress")
async def obtener_progreso_recoleccion():
    """Devuelve el progreso de recolección de todas las vocales."""
    try:
        progreso = obtener_progreso()
        for vocal in VOCALES:
            progreso[vocal]["cantidad"] += len(cola_muestras[vocal])
            progreso[vocal]["porcentaje"] = min(100, (progreso[vocal]["cantidad"] / MAX_MUESTRAS) * 100)
        
        total_muestras = sum(p["cantidad"] for p in progreso.values())
        total_maximo = len(VOCALES) * MAX_MUESTRAS
        porcentaje_total = (total_muestras / total_maximo) * 100
        
        return {
            "vocales": progreso,
            "total": {
                "muestras": total_muestras,
                "max": total_maximo,
                "porcentaje": porcentaje_total
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train")
async def entrenar_modelo():
    """Entrena el modelo de clasificación con los datos recolectados."""
    try:
        progreso = obtener_progreso()
        datos_insuficientes = [vocal for vocal, datos in progreso.items() if datos["cantidad"] < MAX_MUESTRAS]
        
        if datos_insuficientes:
            raise HTTPException(
                status_code=400, 
                detail=f"Datos insuficientes para: {', '.join(datos_insuficientes)}. Recolecta 100 muestras para cada vocal."
            )
        
        X, y = preparar_datos_entrenamiento()
        
        if len(X) == 0:
            raise HTTPException(status_code=400, detail="No hay datos para entrenar")
        
        # Codificar etiquetas de las vocales a números
        codificador_etiquetas = LabelEncoder()
        y_codificada = codificador_etiquetas.fit_transform(y)
        
        # Dividir datos en conjuntos de entrenamiento y prueba
        X_entrenamiento, X_prueba, y_entrenamiento, y_prueba = train_test_split(
            X, y_codificada, test_size=0.2, random_state=42, stratify=y_codificada
        )
        
        # Crear modelo de red neuronal
        modelo = keras.Sequential([
            keras.layers.Dense(128, activation='relu', input_shape=(63,)),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(len(VOCALES), activation='softmax')
        ])
        
        # Compilar modelo
        modelo.compile(
            optimizer='adam',
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Entrenar modelo
        historial = modelo.fit(
            X_entrenamiento, y_entrenamiento,
            epochs=50,
            batch_size=32,
            validation_data=(X_prueba, y_prueba),
            verbose=0
        )
        
        # Evaluar modelo
        perdida_prueba, precision_prueba = modelo.evaluate(X_prueba, y_prueba, verbose=0)
        
        # Guardar modelo y codificador
        ruta_modelo = os.path.join(DIR_MODELOS, "modelo_vocales.h5")
        ruta_codificador = os.path.join(DIR_MODELOS, "codificador_etiquetas.pkl")
        
        modelo.save(ruta_modelo)
        joblib.dump(codificador_etiquetas, ruta_codificador)
        
        return {
            "mensaje": "Entrenamiento completado ✅",
            "precision": float(precision_prueba),
            "perdida": float(perdida_prueba),
            "muestras_usadas": len(X),
            "modelo_guardado_en": ruta_modelo
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def predecir_vocal(datos: SolicitudPrediccion):
    """Predice la vocal basada en los puntos clave proporcionados."""
    try:
        ruta_modelo = os.path.join(DIR_MODELOS, "modelo_vocales.h5")
        ruta_codificador = os.path.join(DIR_MODELOS, "codificador_etiquetas.pkl")
        
        if not os.path.exists(ruta_modelo) or not os.path.exists(ruta_codificador):
            raise HTTPException(status_code=400, detail="Modelo no entrenado. Por favor, entrena el modelo primero.")
        
        # Cargar modelo y codificador
        modelo = keras.models.load_model(ruta_modelo)
        codificador_etiquetas = joblib.load(ruta_codificador)
        
        if len(datos.puntos_clave) != 21 or any(len(punto) != 3 for punto in datos.puntos_clave):
            raise HTTPException(status_code=400, detail="Puntos clave inválidos")
        
        # Preparar datos para la predicción
        puntos_clave_aplanados = np.array(datos.puntos_clave).flatten().reshape(1, -1)
        
        # Predecir la clase
        predicciones = modelo.predict(puntos_clave_aplanados, verbose=0)
        clase_predicha = np.argmax(predicciones[0])
        confianza = float(predicciones[0][clase_predicha])
        
        # Decodificar la etiqueta numérica a la vocal
        vocal_predicha = codificador_etiquetas.inverse_transform([clase_predicha])[0]
        
        # Obtener probabilidades para todas las clases
        probabilidades = {
            vocal: float(predicciones[0][i]) 
            for i, vocal in enumerate(codificador_etiquetas.classes_)
        }
        
        return {
            "prediccion": vocal_predicha,
            "confianza": confianza,
            "todas_las_probabilidades": probabilidades
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset")
async def reiniciar_datos():
    """Reinicia todos los datos de recolección y el modelo entrenado."""
    try:
        for vocal in VOCALES:
            ruta_archivo = obtener_ruta_archivo(vocal)
            if os.path.exists(ruta_archivo):
                os.remove(ruta_archivo)
            cola_muestras[vocal] = []
        
        ruta_modelo = os.path.join(DIR_MODELOS, "modelo_vocales.h5")
        ruta_codificador = os.path.join(DIR_MODELOS, "codificador_etiquetas.pkl")
        
        if os.path.exists(ruta_modelo):
            os.remove(ruta_modelo)
        if os.path.exists(ruta_codificador):
            os.remove(ruta_codificador)
        
        return {
            "mensaje": "Datos reiniciados correctamente",
            "progreso": obtener_progreso()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)