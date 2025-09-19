from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import json
import os
from datetime import datetime

from config import (
    CLASES_DISPONIBLES, TODAS_LAS_CLASES, CLASE_A_CATEGORIA, DATOS_CONFIG,
    obtener_ruta_datos, obtener_ruta_modelo, obtener_ruta_encoder, validar_clase
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

# --- Variables globales para vocales ---
cola_muestras_vocales = {}  # {clase: []}
esta_guardando_vocales = {}  # {clase: bool}

# --- Funciones auxiliares ---
def inicializar_cola_vocal(clase: str):
    """Inicializa las estructuras de cola para una vocal."""
    if clase not in cola_muestras_vocales:
        cola_muestras_vocales[clase] = []
        esta_guardando_vocales[clase] = False

async def tarea_guardar_cola_vocal_en_disco(clase: str):
    """Tarea de fondo para guardar las muestras de vocales en lotes."""
    inicializar_cola_vocal(clase)
    
    while True:
        await asyncio.sleep(5)  # Guardar cada 5 segundos
        
        if not esta_guardando_vocales[clase] and cola_muestras_vocales[clase]:
            esta_guardando_vocales[clase] = True
            try:
                await guardar_muestras_vocal(clase)
                cola_muestras_vocales[clase].clear()
            finally:
                esta_guardando_vocales[clase] = False

async def guardar_muestras_vocal(clase: str):
    """Guarda las muestras de vocales en disco de forma asíncrona."""
    if not cola_muestras_vocales[clase]:
        return
    
    ruta_archivo = obtener_ruta_datos(clase)
    
    # Crear directorio si no existe
    os.makedirs(os.path.dirname(ruta_archivo), exist_ok=True)
    
    # Leer datos existentes
    datos_existentes = []
    if os.path.exists(ruta_archivo):
        try:
            with open(ruta_archivo, 'r') as f:
                datos_existentes = json.load(f)
        except:
            datos_existentes = []
    
    # Agregar nuevas muestras
    datos_existentes.extend(cola_muestras_vocales[clase])
    
    # Guardar de forma atómica
    ruta_temporal = ruta_archivo + ".tmp"
    with open(ruta_temporal, 'w') as f:
        json.dump(datos_existentes, f, indent=2)
    
    os.replace(ruta_temporal, ruta_archivo)

def obtener_estadisticas_vocal(clase: str):
    """Obtiene estadísticas de una vocal específica."""
    ruta_archivo = obtener_ruta_datos(clase)
    
    if not os.path.exists(ruta_archivo):
        return {
            'total_muestras': 0,
            'tiene_modelo': False,
            'puede_entrenar': False,
            'recoleccion_completa': False,
            'progreso_porcentaje': 0.0,
            'muestras_restantes': DATOS_CONFIG['samples_recomendados'],
            'cantidad_recomendada': DATOS_CONFIG['samples_recomendados']
        }
    
    try:
        with open(ruta_archivo, 'r') as f:
            datos = json.load(f)
        total_muestras = len(datos)
    except:
        total_muestras = 0
    
    # Verificar si existe modelo entrenado
    ruta_modelo = obtener_ruta_modelo(clase)
    tiene_modelo = os.path.exists(ruta_modelo)
    
    # Verificar si puede entrenar
    puede_entrenar = total_muestras >= DATOS_CONFIG['samples_minimos']
    
    # Calcular progreso hacia las 100 muestras
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

# --- Endpoints para vocales ---

@router.post("/recolectar/{vocal}")
async def recolectar_muestra_vocal(
    vocal: str, 
    datos: DatosMuestra, 
    tareas_fondo: BackgroundTasks
):
    """Recolecta una muestra para una vocal específica."""
    
    # Validar que sea una vocal
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(
            status_code=400, 
            detail=f"Vocal '{vocal}' no válida. Vocales disponibles: {CLASES_DISPONIBLES['vocales']}"
        )
    
    # Verificar si ya se alcanzó el límite de 100 muestras
    estadisticas_actuales = obtener_estadisticas_vocal(vocal)
    muestras_en_cola = len(cola_muestras_vocales.get(vocal, []))
    total_actual = estadisticas_actuales['total_muestras'] + muestras_en_cola
    
    if total_actual >= DATOS_CONFIG['samples_recomendados']:
        return {
            "mensaje": f"¡Límite alcanzado! La vocal '{vocal}' ya tiene {total_actual} muestras",
            "vocal": vocal,
            "categoria": "vocales",
            "total_muestras": total_actual,
            "limite_alcanzado": True,
            "recoleccion_completa": True,
            "estadisticas": estadisticas_actuales
        }
    
    # Validar puntos clave
    if not validar_puntos_clave(datos.puntos_clave):
        raise HTTPException(
            status_code=400, 
            detail="Puntos clave inválidos"
        )
    
    # Inicializar cola si es necesario
    inicializar_cola_vocal(vocal)
    
    # Agregar timestamp si no se proporciona
    if not datos.fecha_hora:
        datos.fecha_hora = datetime.now().isoformat()
    
    # Agregar muestra a la cola
    muestra = {
        "landmarks": datos.puntos_clave,
        "timestamp": datos.fecha_hora,
        "clase": vocal
    }
    
    cola_muestras_vocales[vocal].append(muestra)
    
    # Programar guardado en segundo plano
    tareas_fondo.add_task(tarea_guardar_cola_vocal_en_disco, vocal)
    
    estadisticas = obtener_estadisticas_vocal(vocal)
    nuevo_total = estadisticas['total_muestras'] + len(cola_muestras_vocales[vocal])
    
    # Verificar si acabamos de completar las 100 muestras
    recoleccion_completa = nuevo_total >= DATOS_CONFIG['samples_recomendados']
    
    return {
        "mensaje": f"Muestra recolectada para vocal '{vocal}'" + 
                  (f" - ¡COMPLETADO! {nuevo_total}/{DATOS_CONFIG['samples_recomendados']} muestras" if recoleccion_completa 
                   else f" - {nuevo_total}/{DATOS_CONFIG['samples_recomendados']} muestras"),
        "vocal": vocal,
        "categoria": "vocales",
        "muestras_en_cola": len(cola_muestras_vocales[vocal]),
        "total_muestras": nuevo_total,
        "recoleccion_completa": recoleccion_completa,
        "progreso_porcentaje": round((nuevo_total / DATOS_CONFIG['samples_recomendados']) * 100, 1),
        "estadisticas": estadisticas
    }

@router.get("/estadisticas/{vocal}")
async def obtener_estadisticas_vocal_endpoint(vocal: str):
    """Obtiene estadísticas detalladas de una vocal específica."""
    
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(
            status_code=400, 
            detail=f"Vocal '{vocal}' no válida"
        )
    
    estadisticas = obtener_estadisticas_vocal(vocal)
    estadisticas['vocal'] = vocal
    estadisticas['categoria'] = "vocales"
    
    return estadisticas

@router.get("/estadisticas")
async def obtener_estadisticas_vocales():
    """Obtiene estadísticas de todas las vocales."""
    
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
    """Entrena el modelo para una vocal específica."""
    
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(
            status_code=400, 
            detail=f"Vocal '{vocal}' no válida"
        )
    
    # Verificar datos suficientes
    estadisticas = obtener_estadisticas_vocal(vocal)
    if not estadisticas['puede_entrenar']:
        raise HTTPException(
            status_code=400,
            detail=f"Datos insuficientes para entrenar. Se requieren al menos {DATOS_CONFIG['samples_minimos']} muestras, pero solo hay {estadisticas['total_muestras']}"
        )
    
    try:
        resultado = await entrenar_modelo_clase(vocal)
        return {
            "mensaje": f"Modelo de vocal '{vocal}' entrenado exitosamente",
            "vocal": vocal,
            "categoria": "vocales",
            "resultado": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error entrenando modelo: {str(e)}")

@router.post("/prediccion/{vocal}")
async def predecir_vocal(vocal: str, datos: SolicitudPrediccion):
    """Realiza predicción para una vocal específica."""
    
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(
            status_code=400, 
            detail=f"Vocal '{vocal}' no válida"
        )
    
    # Verificar si existe modelo entrenado
    ruta_modelo = obtener_ruta_modelo(vocal)
    if not os.path.exists(ruta_modelo):
        raise HTTPException(
            status_code=400,
            detail=f"No hay modelo entrenado para la vocal '{vocal}'"
        )
    
    try:
        resultado = await predecir_clase(vocal, datos.puntos_clave)
        return {
            "vocal": vocal,
            "categoria": "vocales",
            "prediccion": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

@router.delete("/datos/{vocal}")
async def eliminar_datos_vocal(vocal: str):
    """Elimina todos los datos de una vocal específica."""
    
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(
            status_code=400, 
            detail=f"Vocal '{vocal}' no válida"
        )
    
    ruta_archivo = obtener_ruta_datos(vocal)
    
    try:
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)
            mensaje = f"Datos de la vocal '{vocal}' eliminados exitosamente"
        else:
            mensaje = f"No había datos para la vocal '{vocal}'"
        
        return {
            "mensaje": mensaje,
            "vocal": vocal,
            "categoria": "vocales"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando datos: {str(e)}")

@router.delete("/modelo/{vocal}")
async def eliminar_modelo_vocal(vocal: str):
    """Elimina el modelo entrenado de una vocal específica."""
    
    if vocal not in CLASES_DISPONIBLES['vocales']:
        raise HTTPException(
            status_code=400, 
            detail=f"Vocal '{vocal}' no válida"
        )
    
    try:
        resultado = await eliminar_modelo_clase(vocal)
        return {
            "mensaje": f"Modelo de vocal '{vocal}' eliminado exitosamente",
            "vocal": vocal,
            "categoria": "vocales",
            "resultado": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando modelo: {str(e)}")

@router.get("/")
async def listar_vocales():
    """Lista todas las vocales disponibles."""
    return {
        "vocales": CLASES_DISPONIBLES['vocales'],
        "total": len(CLASES_DISPONIBLES['vocales']),
        "categoria": "vocales"
    }