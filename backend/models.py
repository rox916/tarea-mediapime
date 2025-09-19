import numpy as np
import os
import json
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
import joblib
from typing import List, Tuple, Dict, Optional
import time

from config import (
    obtener_ruta_datos, obtener_ruta_modelo, obtener_ruta_encoder, 
    DATOS_CONFIG, validar_clase, CLASE_A_CATEGORIA
)
from utils import validar_puntos_clave

# Cache global para modelos entrenados
cache_modelos = {}
cache_codificadores = {}

class ModeloClase:
    """Clase para manejar el entrenamiento y predicción de modelos por clase individual."""
    
    def __init__(self, clase: str):
        self.clase = clase
        self.categoria = CLASE_A_CATEGORIA[clase]
        self.modelo = None
        self.codificador = None
        self.ultima_carga = 0
        
    def cargar_modelo_entrenado(self) -> bool:
        """Carga un modelo previamente entrenado desde disco."""
        ruta_modelo = obtener_ruta_modelo(self.clase)
        ruta_codificador = obtener_ruta_encoder(self.clase)
        
        if not (os.path.exists(ruta_modelo) and os.path.exists(ruta_codificador)):
            return False
        
        try:
            # Cargar modelo
            self.modelo = keras.models.load_model(ruta_modelo)
            
            # Cargar codificador
            self.codificador = joblib.load(ruta_codificador)
            
            # Actualizar timestamp de carga
            self.ultima_carga = time.time()
            
            return True
            
        except Exception as e:
            print(f"Error cargando modelo para clase {self.clase}: {e}")
            return False
    
    def cargar_datos_entrenamiento(self) -> Tuple[np.ndarray, np.ndarray]:
        """Carga y prepara los datos de entrenamiento para una clase específica."""
        ruta_datos = obtener_ruta_datos(self.clase)
        
        if not os.path.exists(ruta_datos):
            raise FileNotFoundError(f"No se encontraron datos para la clase {self.clase}")
        
        with open(ruta_datos, 'r') as f:
            datos = json.load(f)
        
        if len(datos) < DATOS_CONFIG['samples_minimos']:
            raise ValueError(f"Datos insuficientes para clase {self.clase}. "
                           f"Mínimo: {DATOS_CONFIG['samples_minimos']}, "
                           f"Actual: {len(datos)}")
        
        # Extraer características (landmarks) y etiquetas
        X = []
        y = []
        
        for muestra in datos:
            if 'landmarks' in muestra:
                # Aplanar los landmarks (21 puntos x 3 coordenadas = 63 características)
                landmarks_flat = np.array(muestra['landmarks']).flatten()
                X.append(landmarks_flat)
                y.append(self.clase)  # Todas las muestras tienen la misma etiqueta
        
        X = np.array(X)
        y = np.array(y)
        
        return X, y
    
    def crear_modelo(self, num_caracteristicas: int) -> keras.Sequential:
        """Crea un modelo de red neuronal para clasificación binaria."""
        modelo = keras.Sequential([
            keras.layers.Dense(128, activation='relu', input_shape=(num_caracteristicas,)),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(64, activation='relu'),
            keras.layers.Dropout(0.3),
            keras.layers.Dense(32, activation='relu'),
            keras.layers.Dense(1, activation='sigmoid')  # Clasificación binaria
        ])
        
        modelo.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return modelo
    
    def entrenar(self) -> Dict:
        """Entrena el modelo para la clase específica."""
        try:
            # Cargar datos
            X, y = self.cargar_datos_entrenamiento()
            
            # Para clasificación binaria, convertir etiquetas a 0/1
            # 1 = es la clase objetivo, 0 = no es la clase objetivo
            y_binario = np.ones(len(y))  # Todas las muestras son de la clase objetivo
            
            # Dividir datos en entrenamiento y validación
            X_train, X_val, y_train, y_val = train_test_split(
                X, y_binario, test_size=0.2, random_state=42
            )
            
            # Crear y entrenar modelo
            self.modelo = self.crear_modelo(X.shape[1])
            
            # Entrenar modelo
            history = self.modelo.fit(
                X_train, y_train,
                epochs=50,
                batch_size=32,
                validation_data=(X_val, y_val),
                verbose=0
            )
            
            # Evaluar modelo
            val_loss, val_accuracy = self.modelo.evaluate(X_val, y_val, verbose=0)
            
            # Guardar modelo y codificador
            self.guardar_modelo()
            
            return {
                "exito": True,
                "clase": self.clase,
                "categoria": self.categoria,
                "muestras_entrenamiento": len(X_train),
                "muestras_validacion": len(X_val),
                "precision_validacion": float(val_accuracy),
                "perdida_validacion": float(val_loss),
                "epocas": 50
            }
            
        except Exception as e:
            return {
                "exito": False,
                "error": str(e),
                "clase": self.clase
            }
    
    def guardar_modelo(self):
        """Guarda el modelo y codificador entrenados."""
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(obtener_ruta_modelo(self.clase)), exist_ok=True)
        
        # Guardar modelo
        self.modelo.save(obtener_ruta_modelo(self.clase))
        
        # Crear y guardar codificador simple para la clase
        self.codificador = LabelEncoder()
        self.codificador.fit([self.clase])  # Solo una clase
        joblib.dump(self.codificador, obtener_ruta_encoder(self.clase))
    
    def predecir(self, puntos_clave: List[List[float]]) -> Dict:
        """Realiza predicción para los puntos clave dados."""
        try:
            # Validar puntos clave
            if not validar_puntos_clave(puntos_clave):
                return {
                    "exito": False,
                    "error": "Puntos clave inválidos"
                }
            
            # Cargar modelo si no está cargado
            if self.modelo is None:
                if not self.cargar_modelo_entrenado():
                    return {
                        "exito": False,
                        "error": f"No hay modelo entrenado para la clase {self.clase}"
                    }
            
            # Preparar datos para predicción
            landmarks_flat = np.array(puntos_clave).flatten().reshape(1, -1)
            
            # Realizar predicción
            prediccion = self.modelo.predict(landmarks_flat, verbose=0)[0][0]
            confianza = float(prediccion)
            
            # Determinar si es la clase objetivo (umbral 0.5)
            es_clase_objetivo = confianza > 0.5
            
            return {
                "exito": True,
                "clase_predicha": self.clase if es_clase_objetivo else "no_" + self.clase,
                "confianza": confianza,
                "es_clase_objetivo": es_clase_objetivo,
                "umbral": 0.5
            }
            
        except Exception as e:
            return {
                "exito": False,
                "error": str(e)
            }

# --- Funciones de utilidad ---

def obtener_modelo_clase(clase: str) -> ModeloClase:
    """Obtiene una instancia del modelo para una clase específica."""
    if clase not in cache_modelos:
        cache_modelos[clase] = ModeloClase(clase)
    return cache_modelos[clase]

async def entrenar_modelo_clase(clase: str) -> Dict:
    """Entrena un modelo para una clase específica."""
    if not validar_clase(clase):
        raise ValueError(f"Clase '{clase}' no válida")
    
    modelo = obtener_modelo_clase(clase)
    return modelo.entrenar()

async def predecir_clase(clase: str, puntos_clave: List[List[float]]) -> Dict:
    """Realiza predicción para una clase específica."""
    if not validar_clase(clase):
        raise ValueError(f"Clase '{clase}' no válida")
    
    modelo = obtener_modelo_clase(clase)
    return modelo.predecir(puntos_clave)

async def eliminar_modelo_clase(clase: str) -> Dict:
    """Elimina el modelo entrenado de una clase específica."""
    try:
        ruta_modelo = obtener_ruta_modelo(clase)
        ruta_encoder = obtener_ruta_encoder(clase)
        
        archivos_eliminados = []
        
        if os.path.exists(ruta_modelo):
            os.remove(ruta_modelo)
            archivos_eliminados.append("modelo")
        
        if os.path.exists(ruta_encoder):
            os.remove(ruta_encoder)
            archivos_eliminados.append("encoder")
        
        # Limpiar cache
        if clase in cache_modelos:
            del cache_modelos[clase]
        
        return {
            "exito": True,
            "archivos_eliminados": archivos_eliminados,
            "clase": clase
        }
        
    except Exception as e:
        return {
            "exito": False,
            "error": str(e),
            "clase": clase
        }

def obtener_info_modelo_clase(clase: str) -> Dict:
    """Obtiene información sobre el modelo de una clase específica."""
    if not validar_clase(clase):
        return {
            "existe": False,
            "error": f"Clase '{clase}' no válida"
        }
    
    ruta_modelo = obtener_ruta_modelo(clase)
    ruta_encoder = obtener_ruta_encoder(clase)
    
    if not os.path.exists(ruta_modelo):
        return {
            "existe": False,
            "clase": clase,
            "categoria": CLASE_A_CATEGORIA[clase]
        }
    
    try:
        # Obtener información del archivo
        stat_modelo = os.stat(ruta_modelo)
        
        return {
            "existe": True,
            "clase": clase,
            "categoria": CLASE_A_CATEGORIA[clase],
            "tamaño_archivo": stat_modelo.st_size,
            "fecha_creacion": stat_modelo.st_ctime,
            "fecha_modificacion": stat_modelo.st_mtime,
            "tiene_encoder": os.path.exists(ruta_encoder)
        }
        
    except Exception as e:
        return {
            "existe": False,
            "error": str(e),
            "clase": clase
        }