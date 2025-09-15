import os
import json
from datetime import datetime
from typing import List, Dict

# Configuración
VOCALES = ["A", "E", "I", "O", "U"]
MAX_MUESTRAS = 100
DIR_DATOS = "data_storage"
DIR_MODELOS = "models"

def crear_directorios():
    """Crea los directorios necesarios para el almacenamiento de datos y modelos."""
    os.makedirs(DIR_DATOS, exist_ok=True)
    os.makedirs(DIR_MODELOS, exist_ok=True)

def obtener_ruta_archivo(vocal: str) -> str:
    """Devuelve la ruta del archivo de datos para una vocal específica."""
    return os.path.join(DIR_DATOS, f"{vocal.lower()}_samples.json")

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

def obtener_progreso() -> Dict[str, Dict]:
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

def validar_puntos_clave(puntos_clave: List[List[float]]) -> bool:
    """Valida que los puntos clave tengan el formato correcto."""
    if len(puntos_clave) != 21:
        return False
    
    for punto in puntos_clave:
        if len(punto) != 3:
            return False
    
    return True

def calcular_estadisticas_totales(progreso: Dict[str, Dict]) -> Dict:
    """Calcula las estadísticas totales del progreso de recolección."""
    total_muestras = sum(p["cantidad"] for p in progreso.values())
    total_maximo = len(VOCALES) * MAX_MUESTRAS
    porcentaje_total = (total_muestras / total_maximo) * 100
    
    return {
        "muestras": total_muestras,
        "max": total_maximo,
        "porcentaje": porcentaje_total
    }

def eliminar_datos_vocal(vocal: str):
    """Elimina los datos de una vocal específica."""
    ruta_archivo = obtener_ruta_archivo(vocal)
    if os.path.exists(ruta_archivo):
        os.remove(ruta_archivo)

def eliminar_todos_los_datos():
    """Elimina todos los datos de recolección."""
    for vocal in VOCALES:
        eliminar_datos_vocal(vocal)

def verificar_datos_suficientes() -> List[str]:
    """Verifica si hay suficientes datos para entrenar y devuelve las vocales con datos insuficientes."""
    progreso = obtener_progreso()
    # Modificado temporalmente para permitir entrenar con menos muestras (mínimo 2)
    return [vocal for vocal, datos in progreso.items() if datos["cantidad"] < 2]