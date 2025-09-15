import numpy as np
import os
import json
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
import joblib
from typing import List, Tuple

# Configuración
VOCALES = ["A", "E", "I", "O", "U"]
MAX_MUESTRAS = 100
DIR_DATOS = "data_storage"
DIR_MODELOS = "models"

# Variables globales para el modelo y cache
modelo_actual = None
codificador_actual = None
modelo_cache = None
codificador_cache = None
ultima_carga_modelo = 0

def obtener_ruta_archivo(vocal: str) -> str:
    """Devuelve la ruta del archivo de datos para una vocal específica."""
    return os.path.join(DIR_DATOS, f"{vocal.lower()}_samples.json")

def cargar_datos_existentes() -> dict:
    """Carga todos los datos de muestra guardados en el disco."""
    datos_cargados = {vocal: [] for vocal in VOCALES}
    for vocal in VOCALES:
        ruta_archivo = obtener_ruta_archivo(vocal)
        if os.path.exists(ruta_archivo):
            with open(ruta_archivo, 'r') as f:
                datos_cargados[vocal] = json.load(f)
    return datos_cargados

def preparar_datos_entrenamiento() -> Tuple[np.ndarray, np.ndarray]:
    """Prepara los datos recolectados para ser usados en el entrenamiento del modelo."""
    datos = cargar_datos_existentes()
    
    X = []  # Características (puntos clave aplanados)
    y = []  # Etiquetas (vocales)
    
    for vocal in VOCALES:
        muestras = datos[vocal]
        for muestra in muestras:
            # Aplanar los puntos clave (21 puntos * 3 coordenadas = 63 características)
            puntos_clave_aplanados = np.array(muestra["landmarks"]).flatten()
            X.append(puntos_clave_aplanados)
            y.append(vocal)
    
    return np.array(X), np.array(y)

def crear_modelo() -> keras.Sequential:
    """Crea y devuelve un modelo de red neuronal para clasificación de vocales."""
    modelo = keras.Sequential([
        keras.layers.Dense(128, activation='relu', input_shape=(63,)),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dense(len(VOCALES), activation='softmax')
    ])
    
    modelo.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return modelo

def entrenar_modelo() -> dict:
    """Entrena el modelo de clasificación con los datos recolectados."""
    X, y = preparar_datos_entrenamiento()
    
    if len(X) == 0:
        raise ValueError("No hay datos para entrenar")
    
    # Codificar etiquetas de las vocales a números
    codificador_etiquetas = LabelEncoder()
    y_codificada = codificador_etiquetas.fit_transform(y)
    
    # Dividir datos en conjuntos de entrenamiento y prueba
    # Si hay pocas muestras, ajustar test_size y no usar stratify
    if len(X) < 20:
        # Para pocas muestras, usar test_size=1 muestra por clase como mínimo
        test_size = max(len(VOCALES), int(len(X) * 0.2))
        test_size = min(test_size, len(X) - len(VOCALES))  # Asegurar que queden muestras para entrenamiento
        X_entrenamiento, X_prueba, y_entrenamiento, y_prueba = train_test_split(
            X, y_codificada, test_size=test_size, random_state=42
        )
    else:
        X_entrenamiento, X_prueba, y_entrenamiento, y_prueba = train_test_split(
            X, y_codificada, test_size=0.2, random_state=42, stratify=y_codificada
        )
    
    # Crear y entrenar modelo
    modelo = crear_modelo()
    
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
        "precision": float(precision_prueba),
        "perdida": float(perdida_prueba),
        "muestras_usadas": len(X),
        "modelo_guardado_en": ruta_modelo
    }

def cargar_modelo_entrenado() -> Tuple[keras.Model, LabelEncoder]:
    """Carga el modelo entrenado y el codificador de etiquetas con cache."""
    global modelo_cache, codificador_cache, ultima_carga_modelo
    import time
    
    ruta_modelo = os.path.join(DIR_MODELOS, "modelo_vocales.h5")
    ruta_codificador = os.path.join(DIR_MODELOS, "codificador_etiquetas.pkl")
    
    if not os.path.exists(ruta_modelo) or not os.path.exists(ruta_codificador):
        raise FileNotFoundError("Modelo no entrenado. Por favor, entrena el modelo primero.")
    
    # Verificar si necesitamos recargar el modelo
    tiempo_actual = time.time()
    modelo_modificado = os.path.getmtime(ruta_modelo)
    
    # Usar cache si el modelo no ha cambiado y fue cargado recientemente
    if (modelo_cache is not None and codificador_cache is not None and 
        modelo_modificado <= ultima_carga_modelo):
        return modelo_cache, codificador_cache
    
    # Cargar modelo desde disco
    print("🔄 Cargando modelo desde disco...")
    modelo = keras.models.load_model(ruta_modelo)
    codificador_etiquetas = joblib.load(ruta_codificador)
    
    # Actualizar cache
    modelo_cache = modelo
    codificador_cache = codificador_etiquetas
    ultima_carga_modelo = tiempo_actual
    
    print("✅ Modelo cargado en cache")
    return modelo, codificador_etiquetas

def predecir_vocal(puntos_clave: List[List[float]]) -> dict:
    """Predice la vocal basada en los puntos clave proporcionados."""
    import time
    start_time = time.time()
    
    if len(puntos_clave) != 21 or any(len(punto) != 3 for punto in puntos_clave):
        raise ValueError("Puntos clave inválidos")
    
    # Cargar modelo y codificador (optimización: cache en memoria)
    modelo, codificador_etiquetas = cargar_modelo_entrenado()
    
    # Preparar datos para la predicción
    puntos_clave_aplanados = np.array(puntos_clave, dtype=np.float32).flatten().reshape(1, -1)
    
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
    
    # Log del tiempo de procesamiento
    processing_time = time.time() - start_time
    if processing_time > 0.1:  # Log solo si toma más de 100ms
        print(f"⚠️ Predicción lenta: {processing_time:.3f}s")
    
    return {
        "prediccion": vocal_predicha,
        "confianza": confianza,
        "todas_las_probabilidades": probabilidades
    }

def eliminar_modelo():
    """Elimina el modelo entrenado y el codificador de etiquetas."""
    ruta_modelo = os.path.join(DIR_MODELOS, "modelo_vocales.h5")
    ruta_codificador = os.path.join(DIR_MODELOS, "codificador_etiquetas.pkl")
    
    if os.path.exists(ruta_modelo):
        os.remove(ruta_modelo)
    if os.path.exists(ruta_codificador):
        os.remove(ruta_codificador)