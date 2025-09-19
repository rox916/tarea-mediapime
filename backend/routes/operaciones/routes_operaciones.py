from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import json
import os
from datetime import datetime
import re

from config import (
    CLASES_DISPONIBLES, TODAS_LAS_CLASES, CLASE_A_CATEGORIA, DATOS_CONFIG,
    obtener_ruta_datos, obtener_ruta_modelo, obtener_ruta_encoder, validar_clase
)
from models import entrenar_modelo_clase, predecir_clase, eliminar_modelo_clase
from utils import validar_puntos_clave

# Crear el router para operaciones
router = APIRouter(prefix="/api/operaciones", tags=["operaciones"])

# --- Modelos de datos ---
class DatosMuestra(BaseModel):
    puntos_clave: List[List[float]]
    fecha_hora: Optional[str] = None

class SolicitudPrediccion(BaseModel):
    puntos_clave: List[List[float]]

class ExpresionMatematica(BaseModel):
    expresion: str

# --- Variables globales para operaciones ---
cola_muestras_operaciones = {}  # {clase: []}
esta_guardando_operaciones = {}  # {clase: bool}

# --- Funciones auxiliares ---
def inicializar_cola_operacion(clase: str):
    """Inicializa las estructuras de cola para una operación."""
    if clase not in cola_muestras_operaciones:
        cola_muestras_operaciones[clase] = []
        esta_guardando_operaciones[clase] = False

async def tarea_guardar_cola_operacion_en_disco(clase: str):
    """Tarea de fondo para guardar las muestras de operaciones en lotes."""
    inicializar_cola_operacion(clase)
    
    while True:
        await asyncio.sleep(5)  # Guardar cada 5 segundos
        
        if not esta_guardando_operaciones[clase] and cola_muestras_operaciones[clase]:
            esta_guardando_operaciones[clase] = True
            try:
                await guardar_muestras_operacion(clase)
                cola_muestras_operaciones[clase].clear()
            finally:
                esta_guardando_operaciones[clase] = False

async def guardar_muestras_operacion(clase: str):
    """Guarda las muestras de operaciones en disco de forma asíncrona."""
    if not cola_muestras_operaciones[clase]:
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
    datos_existentes.extend(cola_muestras_operaciones[clase])
    
    # Guardar de forma atómica
    ruta_temporal = ruta_archivo + ".tmp"
    with open(ruta_temporal, 'w') as f:
        json.dump(datos_existentes, f, indent=2)
    
    os.replace(ruta_temporal, ruta_archivo)

def obtener_estadisticas_operacion(clase: str):
    """Obtiene estadísticas de una operación específica."""
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

def evaluar_expresion_matematica(expresion: str):
    """Evalúa una expresión matemática de forma segura."""
    # Limpiar la expresión
    expresion = expresion.strip()
    
    # Validar que solo contenga números, operadores y espacios
    patron_valido = r'^[0-9+\-*/().\s]+$'
    if not re.match(patron_valido, expresion):
        raise ValueError("Expresión contiene caracteres no válidos")
    
    # Evaluar de forma segura
    try:
        resultado = eval(expresion)
        return {
            "expresion": expresion,
            "resultado": resultado,
            "valida": True
        }
    except Exception as e:
        return {
            "expresion": expresion,
            "error": str(e),
            "valida": False
        }

# --- Endpoints para operaciones ---

@router.post("/recolectar/{operacion}")
async def recolectar_muestra_operacion(
    operacion: str, 
    datos: DatosMuestra, 
    tareas_fondo: BackgroundTasks
):
    """Recolecta una muestra para una operación específica."""
    
    # Validar que sea una operación válida
    if operacion not in CLASES_DISPONIBLES['operaciones']:
        raise HTTPException(
            status_code=400, 
            detail=f"Operación '{operacion}' no válida. Operaciones disponibles: {CLASES_DISPONIBLES['operaciones']}"
        )
    
    # Verificar si ya se alcanzó el límite de 100 muestras
    estadisticas_actuales = obtener_estadisticas_operacion(operacion)
    muestras_en_cola = len(cola_muestras_operaciones.get(operacion, []))
    total_actual = estadisticas_actuales['total_muestras'] + muestras_en_cola
    
    if total_actual >= DATOS_CONFIG['samples_recomendados']:
        return {
            "mensaje": f"¡Límite alcanzado! La operación '{operacion}' ya tiene {total_actual} muestras",
            "operacion": operacion,
            "categoria": "operaciones",
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
    inicializar_cola_operacion(operacion)
    
    # Agregar timestamp si no se proporciona
    if not datos.fecha_hora:
        datos.fecha_hora = datetime.now().isoformat()
    
    # Agregar muestra a la cola
    muestra = {
        "landmarks": datos.puntos_clave,
        "timestamp": datos.fecha_hora,
        "clase": operacion
    }
    
    cola_muestras_operaciones[operacion].append(muestra)
    
    # Programar guardado en segundo plano
    tareas_fondo.add_task(tarea_guardar_cola_operacion_en_disco, operacion)
    
    estadisticas = obtener_estadisticas_operacion(operacion)
    nuevo_total = estadisticas['total_muestras'] + len(cola_muestras_operaciones[operacion])
    
    # Verificar si acabamos de completar las 100 muestras
    recoleccion_completa = nuevo_total >= DATOS_CONFIG['samples_recomendados']
    
    return {
        "mensaje": f"Muestra recolectada para operación '{operacion}'" + 
                  (f" - ¡COMPLETADO! {nuevo_total}/{DATOS_CONFIG['samples_recomendados']} muestras" if recoleccion_completa 
                   else f" - {nuevo_total}/{DATOS_CONFIG['samples_recomendados']} muestras"),
        "operacion": operacion,
        "categoria": "operaciones",
        "muestras_en_cola": len(cola_muestras_operaciones[operacion]),
        "total_muestras": nuevo_total,
        "recoleccion_completa": recoleccion_completa,
        "progreso_porcentaje": round((nuevo_total / DATOS_CONFIG['samples_recomendados']) * 100, 1),
        "estadisticas": estadisticas
    }

@router.get("/estadisticas/{operacion}")
async def obtener_estadisticas_operacion_endpoint(operacion: str):
    """Obtiene estadísticas detalladas de una operación específica."""
    
    if operacion not in CLASES_DISPONIBLES['operaciones']:
        raise HTTPException(
            status_code=400, 
            detail=f"Operación '{operacion}' no válida"
        )
    
    estadisticas = obtener_estadisticas_operacion(operacion)
    estadisticas['operacion'] = operacion
    estadisticas['categoria'] = "operaciones"
    
    return estadisticas

@router.get("/estadisticas")
async def obtener_estadisticas_operaciones():
    """Obtiene estadísticas de todas las operaciones."""
    
    estadisticas_operaciones = {}
    operaciones_completas = 0
    total_muestras = 0
    
    for operacion in CLASES_DISPONIBLES['operaciones']:
        stats = obtener_estadisticas_operacion(operacion)
        estadisticas_operaciones[operacion] = stats
        if stats['recoleccion_completa']:
            operaciones_completas += 1
        total_muestras += stats['total_muestras']
    
    progreso_general = round((operaciones_completas / len(CLASES_DISPONIBLES['operaciones'])) * 100, 1)
    
    return {
        "estadisticas_operaciones": estadisticas_operaciones,
        "configuracion": DATOS_CONFIG,
        "resumen_operaciones": {
            "total_operaciones": len(CLASES_DISPONIBLES['operaciones']),
            "operaciones_completas": operaciones_completas,
            "progreso_general": f"{progreso_general}%",
            "total_muestras_operaciones": total_muestras,
            "objetivo_total": len(CLASES_DISPONIBLES['operaciones']) * DATOS_CONFIG['samples_recomendados']
        }
    }

@router.post("/entrenar/{operacion}")
async def entrenar_modelo_operacion(operacion: str):
    """Entrena el modelo para una operación específica."""
    
    if operacion not in CLASES_DISPONIBLES['operaciones']:
        raise HTTPException(
            status_code=400, 
            detail=f"Operación '{operacion}' no válida"
        )
    
    # Verificar datos suficientes
    estadisticas = obtener_estadisticas_operacion(operacion)
    if not estadisticas['puede_entrenar']:
        raise HTTPException(
            status_code=400,
            detail=f"Datos insuficientes para entrenar. Se requieren al menos {DATOS_CONFIG['samples_minimos']} muestras, pero solo hay {estadisticas['total_muestras']}"
        )
    
    try:
        resultado = await entrenar_modelo_clase(operacion)
        return {
            "mensaje": f"Modelo de operación '{operacion}' entrenado exitosamente",
            "operacion": operacion,
            "categoria": "operaciones",
            "resultado": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error entrenando modelo: {str(e)}")

@router.post("/prediccion/{operacion}")
async def predecir_operacion(operacion: str, datos: SolicitudPrediccion):
    """Realiza predicción para una operación específica."""
    
    if operacion not in CLASES_DISPONIBLES['operaciones']:
        raise HTTPException(
            status_code=400, 
            detail=f"Operación '{operacion}' no válida"
        )
    
    # Verificar si existe modelo entrenado
    ruta_modelo = obtener_ruta_modelo(operacion)
    if not os.path.exists(ruta_modelo):
        raise HTTPException(
            status_code=400,
            detail=f"No hay modelo entrenado para la operación '{operacion}'"
        )
    
    try:
        resultado = await predecir_clase(operacion, datos.puntos_clave)
        return {
            "operacion": operacion,
            "categoria": "operaciones",
            "prediccion": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

@router.post("/expresion_matematica")
async def evaluar_expresion(datos: ExpresionMatematica):
    """Evalúa una expresión matemática."""
    try:
        resultado = evaluar_expresion_matematica(datos.expresion)
        return resultado
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error evaluando expresión: {str(e)}"
        )

@router.delete("/datos/{operacion}")
async def eliminar_datos_operacion(operacion: str):
    """Elimina todos los datos de una operación específica."""
    
    if operacion not in CLASES_DISPONIBLES['operaciones']:
        raise HTTPException(
            status_code=400, 
            detail=f"Operación '{operacion}' no válida"
        )
    
    ruta_archivo = obtener_ruta_datos(operacion)
    
    try:
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)
            mensaje = f"Datos de la operación '{operacion}' eliminados exitosamente"
        else:
            mensaje = f"No había datos para la operación '{operacion}'"
        
        return {
            "mensaje": mensaje,
            "operacion": operacion,
            "categoria": "operaciones"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando datos: {str(e)}")

@router.delete("/modelo/{operacion}")
async def eliminar_modelo_operacion(operacion: str):
    """Elimina el modelo entrenado de una operación específica."""
    
    if operacion not in CLASES_DISPONIBLES['operaciones']:
        raise HTTPException(
            status_code=400, 
            detail=f"Operación '{operacion}' no válida"
        )
    
    try:
        resultado = await eliminar_modelo_clase(operacion)
        return {
            "mensaje": f"Modelo de operación '{operacion}' eliminado exitosamente",
            "operacion": operacion,
            "categoria": "operaciones",
            "resultado": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando modelo: {str(e)}")

@router.get("/")
async def listar_operaciones():
    """Lista todas las operaciones disponibles."""
    return {
        "operaciones": CLASES_DISPONIBLES['operaciones'],
        "total": len(CLASES_DISPONIBLES['operaciones']),
        "categoria": "operaciones"
    }