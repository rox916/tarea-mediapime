from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import os

from config import (
    CLASES_DISPONIBLES, TODAS_LAS_CLASES, CLASE_A_CATEGORIA, DATOS_CONFIG,
    obtener_ruta_datos, obtener_ruta_modelo, MAPEO_OPS  # 👈 importamos el mapa
)

# Crear el router para rutas generales
router = APIRouter(prefix="/api", tags=["general"])

# --- Funciones auxiliares ---
def obtener_estadisticas_clase_general(clase: str):
    """Obtiene estadísticas de cualquier clase (vocal u operación)."""
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
        import json
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

# --- Endpoints generales ---

@router.get("/")
async def info_api():
    """Información general de la API."""
    return {
        "nombre": "MediaPipe API Collection",
        "version": "1.0.0",
        "descripcion": "API para recolección de datos y entrenamiento de modelos con MediaPipe",
        "endpoints": {
            "vocales": "/api/vocales/",
            "operaciones": "/api/operaciones/",
            "estadisticas": "/api/estadisticas",
            "configuracion": "/api/configuracion"
        }
    }

@router.get("/estadisticas")
async def obtener_estadisticas_globales():
    """Obtiene estadísticas globales de todo el sistema."""
    
    # Estadísticas de vocales
    estadisticas_vocales = {}
    vocales_completas = 0
    total_muestras_vocales = 0
    
    for vocal in CLASES_DISPONIBLES['vocales']:
        stats = obtener_estadisticas_clase_general(vocal)
        estadisticas_vocales[vocal] = stats
        if stats['recoleccion_completa']:
            vocales_completas += 1
        total_muestras_vocales += stats['total_muestras']
    
    # Estadísticas de operaciones
    estadisticas_operaciones = {}
    operaciones_completas = 0
    total_muestras_operaciones = 0
    
    for operacion in CLASES_DISPONIBLES['operaciones']:
        stats = obtener_estadisticas_clase_general(operacion)
        estadisticas_operaciones[operacion] = stats
        if stats['recoleccion_completa']:
            operaciones_completas += 1
        total_muestras_operaciones += stats['total_muestras']
    
    # Calcular progresos generales
    progreso_vocales = round((vocales_completas / len(CLASES_DISPONIBLES['vocales'])) * 100, 1)
    progreso_operaciones = round((operaciones_completas / len(CLASES_DISPONIBLES['operaciones'])) * 100, 1)
    
    # Progreso total del sistema
    total_clases = len(CLASES_DISPONIBLES['vocales']) + len(CLASES_DISPONIBLES['operaciones'])
    clases_completas = vocales_completas + operaciones_completas
    progreso_total = round((clases_completas / total_clases) * 100, 1)
    
    return {
        "resumen_global": {
            "total_clases": total_clases,
            "clases_completas": clases_completas,
            "progreso_total": f"{progreso_total}%",
            "total_muestras": total_muestras_vocales + total_muestras_operaciones,
            "objetivo_total_muestras": total_clases * DATOS_CONFIG['samples_recomendados']
        },
        "vocales": {
            "estadisticas": estadisticas_vocales,
            "resumen": {
                "total_vocales": len(CLASES_DISPONIBLES['vocales']),
                "vocales_completas": vocales_completas,
                "progreso": f"{progreso_vocales}%",
                "total_muestras": total_muestras_vocales,
                "objetivo_muestras": len(CLASES_DISPONIBLES['vocales']) * DATOS_CONFIG['samples_recomendados']
            }
        },
        "operaciones": {
            "estadisticas": estadisticas_operaciones,
            "resumen": {
                "total_operaciones": len(CLASES_DISPONIBLES['operaciones']),
                "operaciones_completas": operaciones_completas,
                "progreso": f"{progreso_operaciones}%",
                "total_muestras": total_muestras_operaciones,
                "objetivo_muestras": len(CLASES_DISPONIBLES['operaciones']) * DATOS_CONFIG['samples_recomendados']
            }
        },
        "configuracion": DATOS_CONFIG
    }

@router.get("/configuracion")
async def obtener_configuracion():
    """Obtiene la configuración actual del sistema."""
    return {
        "configuracion": DATOS_CONFIG,
        "clases_disponibles": CLASES_DISPONIBLES,
        "todas_las_clases": TODAS_LAS_CLASES,
        "mapeo_categorias": CLASE_A_CATEGORIA,
        "mapeo_operaciones": MAPEO_OPS  # 👈 añadimos el mapa aquí
    }

@router.get("/clases")
async def listar_todas_las_clases():
    """Lista todas las clases disponibles organizadas por categoría."""
    return {
        "clases_por_categoria": CLASES_DISPONIBLES,
        "todas_las_clases": TODAS_LAS_CLASES,
        "total_clases": len(TODAS_LAS_CLASES),
        "mapeo_categorias": CLASE_A_CATEGORIA
    }

@router.get("/estadisticas/{clase}")
async def obtener_estadisticas_clase(clase: str):
    """Obtiene estadísticas de una clase específica (vocal u operación)."""
    
    if clase not in TODAS_LAS_CLASES:
        raise HTTPException(
            status_code=400,
            detail=f"Clase '{clase}' no válida. Clases disponibles: {TODAS_LAS_CLASES}"
        )
    
    estadisticas = obtener_estadisticas_clase_general(clase)
    categoria = CLASE_A_CATEGORIA.get(clase, "desconocida")
    
    estadisticas['clase'] = clase
    estadisticas['categoria'] = categoria
    
    return estadisticas

@router.get("/salud")
async def verificar_salud():
    """Endpoint de verificación de salud del sistema."""
    
    # Verificar que los directorios necesarios existan
    directorios_necesarios = [
        "datos",
        "modelos",
        "encoders"
    ]
    
    estado_directorios = {}
    for directorio in directorios_necesarios:
        existe = os.path.exists(directorio)
        estado_directorios[directorio] = {
            "existe": existe,
            "ruta": os.path.abspath(directorio)
        }
    
    # Contar archivos de datos y modelos
    total_archivos_datos = 0
    total_modelos = 0
    
    for clase in TODAS_LAS_CLASES:
        if os.path.exists(obtener_ruta_datos(clase)):
            total_archivos_datos += 1
        if os.path.exists(obtener_ruta_modelo(clase)):
            total_modelos += 1
    
    return {
        "estado": "saludable",
        "timestamp": "2024-01-01T00:00:00",  # Se actualizaría con datetime real
        "directorios": estado_directorios,
        "archivos": {
            "total_archivos_datos": total_archivos_datos,
            "total_modelos": total_modelos,
            "total_clases": len(TODAS_LAS_CLASES)
        },
        "configuracion_activa": DATOS_CONFIG
    }
