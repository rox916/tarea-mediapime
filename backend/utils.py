import os
import json
from datetime import datetime
from typing import List, Dict, Optional

# Configuración
MAX_MUESTRAS = 100
MIN_MUESTRAS_ENTRENAMIENTO = 10
DIR_DATOS = "data"
DIR_MODELOS = "models"

def crear_directorios():
    """Crea los directorios necesarios para el almacenamiento de datos y modelos."""
    os.makedirs(DIR_DATOS, exist_ok=True)
    os.makedirs(DIR_MODELOS, exist_ok=True)

def crear_directorio_categoria(categoria: str):
    """Crea el directorio para una categoría específica."""
    ruta_categoria = os.path.join(DIR_DATOS, categoria)
    os.makedirs(ruta_categoria, exist_ok=True)
    return ruta_categoria

def crear_directorio_clase(categoria: str, clase: str):
    """Crea el directorio para una clase específica dentro de una categoría."""
    ruta_clase = os.path.join(DIR_DATOS, categoria, clase)
    os.makedirs(ruta_clase, exist_ok=True)
    return ruta_clase

def obtener_ruta_archivo(categoria: str, clase: str) -> str:
    """Devuelve la ruta del archivo de datos para una clase específica dentro de una categoría."""
    return os.path.join(DIR_DATOS, categoria, clase, "samples.json")

def obtener_ruta_modelo(categoria: str) -> str:
    """Devuelve la ruta del archivo del modelo para una categoría específica."""
    return os.path.join(DIR_MODELOS, f"{categoria}_model.h5")

def obtener_ruta_codificador(categoria: str) -> str:
    """Devuelve la ruta del archivo del codificador para una categoría específica."""
    return os.path.join(DIR_MODELOS, f"{categoria}_encoder.pkl")

def guardar_cola_en_disco(categoria: str, clase: str, datos_cola: List[dict]):
    """Guarda los datos de la cola en el archivo de forma segura y atómica."""
    # Crear directorios si no existen
    crear_directorio_clase(categoria, clase)
    
    ruta_final = obtener_ruta_archivo(categoria, clase)
    ruta_temporal = ruta_final + ".tmp"
    
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
    print(f"[{datetime.now()}] Muestras de '{categoria}/{clase}' guardadas en disco. Total: {len(todas_las_muestras)}")

def obtener_clases_categoria(categoria: str) -> List[str]:
    """Obtiene todas las clases disponibles en una categoría."""
    ruta_categoria = os.path.join(DIR_DATOS, categoria)
    if not os.path.exists(ruta_categoria):
        return []
    
    clases = []
    for item in os.listdir(ruta_categoria):
        ruta_item = os.path.join(ruta_categoria, item)
        if os.path.isdir(ruta_item):
            clases.append(item)
    
    return sorted(clases)

def obtener_categorias_disponibles() -> List[str]:
    """Obtiene todas las categorías disponibles."""
    if not os.path.exists(DIR_DATOS):
        return []
    
    categorias = []
    for item in os.listdir(DIR_DATOS):
        ruta_item = os.path.join(DIR_DATOS, item)
        if os.path.isdir(ruta_item):
            categorias.append(item)
    
    return sorted(categorias)

def obtener_progreso_categoria(categoria: str) -> Dict[str, Dict]:
    """Calcula y devuelve el progreso de recolección de cada clase en una categoría."""
    progreso = {}
    clases = obtener_clases_categoria(categoria)
    
    for clase in clases:
        ruta_archivo = obtener_ruta_archivo(categoria, clase)
        cantidad = 0
        if os.path.exists(ruta_archivo):
            with open(ruta_archivo, 'r') as f:
                datos = json.load(f)
                cantidad = len(datos)
        
        progreso[clase] = {
            "cantidad": cantidad,
            "porcentaje": min(100, (cantidad / MAX_MUESTRAS) * 100),
            "completo": cantidad >= MAX_MUESTRAS,
            "listo_entrenamiento": cantidad >= MIN_MUESTRAS_ENTRENAMIENTO
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

def calcular_estadisticas_categoria(progreso: Dict[str, Dict]) -> Dict:
    """Calcula estadísticas generales del progreso de recolección de una categoría."""
    if not progreso:
        return {
            "total_muestras": 0,
            "clases_completas": 0,
            "clases_listas_entrenamiento": 0,
            "total_clases": 0,
            "progreso_general": 0,
            "listo_para_entrenar": False
        }
    
    total_muestras = sum(datos["cantidad"] for datos in progreso.values())
    clases_completas = sum(1 for datos in progreso.values() if datos["completo"])
    clases_listas = sum(1 for datos in progreso.values() if datos["listo_entrenamiento"])
    
    return {
        "total_muestras": total_muestras,
        "clases_completas": clases_completas,
        "clases_listas_entrenamiento": clases_listas,
        "total_clases": len(progreso),
        "progreso_general": (clases_completas / len(progreso)) * 100,
        "listo_para_entrenar": clases_listas >= 2  # Mínimo 2 clases para entrenar
    }

def eliminar_datos_clase(categoria: str, clase: str):
    """Elimina todos los datos de una clase específica."""
    ruta_archivo = obtener_ruta_archivo(categoria, clase)
    if os.path.exists(ruta_archivo):
        os.remove(ruta_archivo)
    
    # Eliminar directorio de la clase si está vacío
    ruta_clase = os.path.join(DIR_DATOS, categoria, clase)
    if os.path.exists(ruta_clase) and not os.listdir(ruta_clase):
        os.rmdir(ruta_clase)

def eliminar_datos_categoria(categoria: str):
    """Elimina todos los datos de una categoría específica."""
    clases = obtener_clases_categoria(categoria)
    for clase in clases:
        eliminar_datos_clase(categoria, clase)
    
    # Eliminar directorio de la categoría si está vacío
    ruta_categoria = os.path.join(DIR_DATOS, categoria)
    if os.path.exists(ruta_categoria) and not os.listdir(ruta_categoria):
        os.rmdir(ruta_categoria)

def eliminar_modelo_categoria(categoria: str):
    """Elimina el modelo entrenado de una categoría específica."""
    ruta_modelo = obtener_ruta_modelo(categoria)
    ruta_codificador = obtener_ruta_codificador(categoria)
    
    if os.path.exists(ruta_modelo):
        os.remove(ruta_modelo)
    if os.path.exists(ruta_codificador):
        os.remove(ruta_codificador)

def eliminar_todos_los_datos():
    """Elimina todos los datos de muestra guardados."""
    categorias = obtener_categorias_disponibles()
    for categoria in categorias:
        eliminar_datos_categoria(categoria)

def verificar_datos_suficientes_categoria(categoria: str) -> List[str]:
    """Verifica qué clases no tienen suficientes datos para entrenar en una categoría."""
    progreso = obtener_progreso_categoria(categoria)
    return [clase for clase, datos in progreso.items() if not datos["listo_entrenamiento"]]

def cargar_datos_categoria(categoria: str) -> Dict[str, List]:
    """Carga todos los datos de muestra de una categoría."""
    datos_cargados = {}
    clases = obtener_clases_categoria(categoria)
    
    for clase in clases:
        ruta_archivo = obtener_ruta_archivo(categoria, clase)
        if os.path.exists(ruta_archivo):
            with open(ruta_archivo, 'r') as f:
                datos_cargados[clase] = json.load(f)
        else:
            datos_cargados[clase] = []
    
    return datos_cargados