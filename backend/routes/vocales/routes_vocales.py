from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime

from config import (
    CLASES_DISPONIBLES, DATOS_CONFIG,
    obtener_ruta_datos, obtener_ruta_modelo, validar_clase
)
from models import entrenar_modelo_clase, predecir_clase, eliminar_modelo_clase
from utils import validar_puntos_clave

# Crear el router para vocales
router = APIRouter(prefix="/api/vocales", tags=["vocales"])

# --- Modelos de datos ---
class DatosMuestra(BaseModel):
    puntos_clave: List[List[float]]
    fecha_hora: Optional[str] = None

class SolicitudPrediccion(BaseModel):
    puntos_clave: List[List[float]]

# --- Variables globales ---
cola_muestras_vocales = {}  # {clase: []}
esta_guardando_vocales = {}  # {clase: bool}

# --- Funciones auxiliares ---
def inicializar_cola_vocal(clase: str):
    """Inicializa estructuras de cola para una vocal."""
    if clase not in cola_muestras_vocales:
        cola_muestras_vocales[clase] = []
        esta_guardando_vocales[clase] = False

async def guardar_muestras_vocal(clase: str):
    """Guarda las muestras en disco."""
    if not cola_muestras_vocales[clase]:
        return
    
    ruta_archivo = obtener_ruta_datos(clase)
    os.makedirs(os.path.dirname(ruta_archivo), exist_ok=True)
    
    datos_existentes = []
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, 'r') as f:
                datos_existentes = json.load(f)
        except:
            datos_existentes = []
    
    datos_existentes.extend(cola_muestras_vocales[clase])
    
    ruta_temporal = ruta_archivo + ".tmp"
    with open(ruta_temporal, 'w') as f:
        json.dump(datos_existentes, f, indent=2)
    
    os.replace(ruta_temporal, ruta_archivo)

    cola_muestras_vocales[clase].clear()

def obtener_estadisticas_vocal(clase: str):
    """Obtiene estadísticas de una vocal (incluyendo muestras en cola)."""
    ruta_archivo = obtener_ruta_datos(clase)

    if not os.path.exists(ruta_archivo):
        total_muestras = 0
    else:
        try:
            with open(ruta_archivo, 'r') as f:
                datos = json.load(f)
            total_muestras = len(datos)
        except:
            total_muestras = 0

    # 👇 Sumar también las que están en la cola
    en_cola = len(cola_muestras_vocales.get(clase, []))
    total_muestras += en_cola

    ruta_modelo = obtener_ruta_modelo(clase)
    tiene_modelo = os.path.exists(ruta_modelo)

    puede_entrenar = total_muestras >= DATOS_CONFIG['samples_minimos']
    recoleccion_completa = total_muestras >= DATOS_CONFIG['samples_recomendados']
    progreso_porcentaje = round((total_muestras / DATOS_CONFIG['samples_recomendados']) * 100, 1)
    muestras_restantes = max(0, DATOS_CONFIG['samples_recomendados'] - total_muestras)

    return {
        'total_muestras': total_muestras,
        'tiene_modelo': tiene_modelo,
        'puede_entrenar': puede_entrenar,
        'recoleccion_completa': recoleccion_completa,
        'progreso_porcentaje': progreso_porcentaje,
        'muestras_restantes': muestras_restantes,
        'cantidad_recomendada': DATOS_CONFIG['samples_recomendados']
    }

# --- Endpoints ---
@router.post("/recolectar/{vocal}")
async def recolectar_muestra_vocal(vocal: str, datos: DatosMuestra, tareas_fondo: BackgroundTasks):
    """Recolecta una muestra para una vocal."""
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(status_code=400, detail=f"Vocal '{vocal}' no válida.")

    estadisticas_actuales = obtener_estadisticas_vocal(vocal)
    if estadisticas_actuales['total_muestras'] >= DATOS_CONFIG['samples_recomendados']:
        return {
            "mensaje": f"¡Límite alcanzado! La vocal '{vocal}' ya tiene {estadisticas_actuales['total_muestras']} muestras",
            "vocal": vocal,
            "categoria": "vocales",
            "total_muestras": estadisticas_actuales['total_muestras'],
            "limite_alcanzado": True,
            "recoleccion_completa": True,
            "estadisticas": estadisticas_actuales
        }

    if not validar_puntos_clave(datos.puntos_clave):
        raise HTTPException(status_code=400, detail="Puntos clave inválidos")

    inicializar_cola_vocal(vocal)

    if not datos.fecha_hora:
        datos.fecha_hora = datetime.now().isoformat()

    muestra = {
        "landmarks": datos.puntos_clave,
        "timestamp": datos.fecha_hora,
        "clase": vocal
    }

    cola_muestras_vocales[vocal].append(muestra)
    tareas_fondo.add_task(guardar_muestras_vocal, vocal)

    estadisticas = obtener_estadisticas_vocal(vocal)

    return {
        "mensaje": f"Muestra recolectada para vocal '{vocal}' - {estadisticas['total_muestras']}/{DATOS_CONFIG['samples_recomendados']} muestras",
        "vocal": vocal,
        "categoria": "vocales",
        "muestras_en_cola": len(cola_muestras_vocales[vocal]),
        "total_muestras": estadisticas['total_muestras'],
        "recoleccion_completa": estadisticas['recoleccion_completa'],
        "progreso_porcentaje": estadisticas['progreso_porcentaje'],
        "estadisticas": estadisticas
    }

@router.get("/estadisticas/{vocal}")
async def obtener_estadisticas_vocal_endpoint(vocal: str):
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(status_code=400, detail=f"Vocal '{vocal}' no válida")
    return obtener_estadisticas_vocal(vocal)

@router.get("/estadisticas")
async def obtener_estadisticas_vocales():
    estadisticas_vocales = {}
    vocales_completas = 0
    total_muestras = 0
    
    for vocal in CLASES_DISPONIBLES['vocales']:
        stats = obtener_estadisticas_vocal(vocal)
        estadisticas_vocales[vocal] = stats
        if stats['recoleccion_completa']:
            vocales_completas += 1
        total_muestras += stats['total_muestras']
    
    progreso_general = round((vocales_completas / len(CLASES_DISPONIBLES['vocales'])) * 100, 1)
    
    return {
        "estadisticas_vocales": estadisticas_vocales,
        "configuracion": DATOS_CONFIG,
        "resumen_vocales": {
            "total_vocales": len(CLASES_DISPONIBLES['vocales']),
            "vocales_completas": vocales_completas,
            "progreso_general": f"{progreso_general}%",
            "total_muestras_vocales": total_muestras,
            "objetivo_total": len(CLASES_DISPONIBLES['vocales']) * DATOS_CONFIG['samples_recomendados']
        }
    }

@router.post("/entrenar/{vocal}")
async def entrenar_modelo_vocal(vocal: str):
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(status_code=400, detail=f"Vocal '{vocal}' no válida")
    estadisticas = obtener_estadisticas_vocal(vocal)
    if not estadisticas['puede_entrenar']:
        raise HTTPException(status_code=400, detail=f"No hay suficientes datos para entrenar.")
    return await entrenar_modelo_clase(vocal)

@router.post("/prediccion/{vocal}")
async def predecir_vocal(vocal: str, datos: SolicitudPrediccion):
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(status_code=400, detail=f"Vocal '{vocal}' no válida")
    ruta_modelo = obtener_ruta_modelo(vocal)
    if not os.path.exists(ruta_modelo):
        raise HTTPException(status_code=400, detail=f"No hay modelo entrenado para '{vocal}'")
    return await predecir_clase(vocal, datos.puntos_clave)

@router.delete("/datos/{vocal}")
async def eliminar_datos_vocal(vocal: str):
    ruta_archivo = obtener_ruta_datos(vocal)
    if os.path.exists(ruta_archivo):
        os.remove(ruta_archivo)
    return {"mensaje": f"Datos de la vocal '{vocal}' eliminados exitosamente"}

@router.delete("/modelo/{vocal}")
async def eliminar_modelo_vocal(vocal: str):
    return await eliminar_modelo_clase(vocal)
