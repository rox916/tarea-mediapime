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

# Crear el router para números
router = APIRouter(prefix="/api/numeros", tags=["numeros"])

# --- Modelos de datos ---
class DatosMuestra(BaseModel):
    puntos_clave: List[List[float]]
    fecha_hora: Optional[str] = None

class SolicitudPrediccion(BaseModel):
    puntos_clave: List[List[float]]

# --- Variables globales para números ---
cola_muestras_numeros = {}  # {clase: []}
esta_guardando_numeros = {}  # {clase: bool}

# --- Funciones auxiliares ---
def inicializar_cola_numero(clase: str):
    """Inicializa las estructuras de cola para un número."""
    if clase not in cola_muestras_numeros:
        cola_muestras_numeros[clase] = []
        esta_guardando_numeros[clase] = False

async def tarea_guardar_cola_numero_en_disco(clase: str):
    """Tarea de fondo para guardar las muestras de números en lotes."""
    inicializar_cola_numero(clase)
    
    while True:
        await asyncio.sleep(5)  # Guardar cada 5 segundos
        
        if not esta_guardando_numeros[clase] and cola_muestras_numeros[clase]:
            esta_guardando_numeros[clase] = True
            try:
                await guardar_muestras_numero(clase)
                cola_muestras_numeros[clase].clear()
            finally:
                esta_guardando_numeros[clase] = False

async def guardar_muestras_numero(clase: str):
    """Guarda las muestras de números en disco de forma asíncrona."""
    if not cola_muestras_numeros[clase]:
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
    datos_existentes.extend(cola_muestras_numeros[clase])
    
    # Guardar de forma atómica
    ruta_temporal = ruta_archivo + ".tmp"
    with open(ruta_temporal, 'w') as f:
        json.dump(datos_existentes, f, indent=2)
    
    os.replace(ruta_temporal, ruta_archivo)

def obtener_estadisticas_numero(clase: str):
    """Obtiene estadísticas de un número específico."""
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

# --- Endpoints para números ---

@router.post("/recolectar/{numero}")
async def recolectar_muestra_numero(
    numero: str, 
    datos: DatosMuestra, 
    tareas_fondo: BackgroundTasks
):
    """Recolecta una muestra para un número específico."""
    
    # Validar que sea un número válido
    if numero not in CLASES_DISPONIBLES['numeros']:
        raise HTTPException(
            status_code=400, 
            detail=f"Número '{numero}' no válido. Números disponibles: {CLASES_DISPONIBLES['numeros']}"
        )
    
    # Verificar si ya se alcanzó el límite de 100 muestras
    estadisticas_actuales = obtener_estadisticas_numero(numero)
    muestras_en_cola = len(cola_muestras_numeros.get(numero, []))
    total_actual = estadisticas_actuales['total_muestras'] + muestras_en_cola
    
    if total_actual >= DATOS_CONFIG['samples_recomendados']:
        return {
            "mensaje": f"¡Límite alcanzado! El número '{numero}' ya tiene {total_actual} muestras",
            "numero": numero,
            "categoria": "numeros",
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
    inicializar_cola_numero(numero)
    
    # Agregar timestamp si no se proporciona
    if not datos.fecha_hora:
        datos.fecha_hora = datetime.now().isoformat()
    
    # Agregar muestra a la cola
    muestra = {
        "landmarks": datos.puntos_clave,
        "timestamp": datos.fecha_hora,
        "clase": numero
    }
    
    cola_muestras_numeros[numero].append(muestra)
    
    # Programar guardado en segundo plano
    tareas_fondo.add_task(tarea_guardar_cola_numero_en_disco, numero)
    
    estadisticas = obtener_estadisticas_numero(numero)
    nuevo_total = estadisticas['total_muestras'] + len(cola_muestras_numeros[numero])
    
    # Verificar si acabamos de completar las 100 muestras
    recoleccion_completa = nuevo_total >= DATOS_CONFIG['samples_recomendados']
    
    return {
        "mensaje": f"Muestra recolectada para número '{numero}'" + 
                  (f" - ¡COMPLETADO! {nuevo_total}/{DATOS_CONFIG['samples_recomendados']} muestras" if recoleccion_completa 
                   else f" - {nuevo_total}/{DATOS_CONFIG['samples_recomendados']} muestras"),
        "numero": numero,
        "categoria": "numeros",
        "muestras_en_cola": len(cola_muestras_numeros[numero]),
        "total_muestras": nuevo_total,
        "recoleccion_completa": recoleccion_completa,
        "progreso_porcentaje": round((nuevo_total / DATOS_CONFIG['samples_recomendados']) * 100, 1),
        "estadisticas": estadisticas
    }

@router.get("/estadisticas/{numero}")
async def obtener_estadisticas_numero_endpoint(numero: str):
    """Obtiene estadísticas detalladas de un número específico."""
    
    if numero not in CLASES_DISPONIBLES['numeros']:
        raise HTTPException(
            status_code=400, 
            detail=f"Número '{numero}' no válido"
        )
    
    estadisticas = obtener_estadisticas_numero(numero)
    estadisticas['numero'] = numero
    estadisticas['categoria'] = "numeros"
    
    return estadisticas

@router.get("/estadisticas")
async def obtener_estadisticas_numeros():
    """Obtiene estadísticas de todos los números."""
    
    estadisticas_numeros = {}
    numeros_completos = 0
    total_muestras = 0
    
    for numero in CLASES_DISPONIBLES['numeros']:
        stats = obtener_estadisticas_numero(numero)
        estadisticas_numeros[numero] = stats
        if stats['recoleccion_completa']:
            numeros_completos += 1
        total_muestras += stats['total_muestras']
    
    progreso_general = round((numeros_completos / len(CLASES_DISPONIBLES['numeros'])) * 100, 1)
    
    return {
        "estadisticas_numeros": estadisticas_numeros,
        "configuracion": DATOS_CONFIG,
        "resumen_numeros": {
            "total_numeros": len(CLASES_DISPONIBLES['numeros']),
            "numeros_completos": numeros_completos,
            "progreso_general": f"{progreso_general}%",
            "total_muestras_numeros": total_muestras,
            "objetivo_total": len(CLASES_DISPONIBLES['numeros']) * DATOS_CONFIG['samples_recomendados']
        }
    }

@router.post("/entrenar/{numero}")
async def entrenar_modelo_numero(numero: str):
    """Entrena el modelo para un número específico."""
    
    if numero not in CLASES_DISPONIBLES['numeros']:
        raise HTTPException(
            status_code=400, 
            detail=f"Número '{numero}' no válido"
        )
    
    # Verificar datos suficientes
    estadisticas = obtener_estadisticas_numero(numero)
    if not estadisticas['puede_entrenar']:
        raise HTTPException(
            status_code=400,
            detail=f"Datos insuficientes para entrenar. Se requieren al menos {DATOS_CONFIG['samples_minimos']} muestras, pero solo hay {estadisticas['total_muestras']}"
        )
    
    try:
        resultado = await entrenar_modelo_clase(numero)
        return {
            "mensaje": f"Modelo de número '{numero}' entrenado exitosamente",
            "numero": numero,
            "categoria": "numeros",
            "resultado": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error entrenando modelo: {str(e)}")

@router.post("/prediccion/{numero}")
async def predecir_numero(numero: str, datos: SolicitudPrediccion):
    """Realiza predicción para un número específico."""
    
    if numero not in CLASES_DISPONIBLES['numeros']:
        raise HTTPException(
            status_code=400, 
            detail=f"Número '{numero}' no válido"
        )
    
    # Validar puntos clave
    if not validar_puntos_clave(datos.puntos_clave):
        raise HTTPException(
            status_code=400, 
            detail="Puntos clave inválidos"
        )
    
    try:
        resultado = await predecir_clase(numero, datos.puntos_clave)
        return {
            "numero": numero,
            "categoria": "numeros",
            "prediccion": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

@router.delete("/datos/{numero}")
async def eliminar_datos_numero(numero: str):
    """Elimina todos los datos recolectados para un número específico."""
    
    if numero not in CLASES_DISPONIBLES['numeros']:
        raise HTTPException(
            status_code=400, 
            detail=f"Número '{numero}' no válido"
        )
    
    ruta_archivo = obtener_ruta_datos(numero)
    
    if os.path.exists(ruta_archivo):
        os.remove(ruta_archivo)
        return {
            "mensaje": f"Datos del número '{numero}' eliminados exitosamente",
            "numero": numero,
            "categoria": "numeros"
        }
    else:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontraron datos para el número '{numero}'"
        )

@router.delete("/modelo/{numero}")
async def eliminar_modelo_numero(numero: str):
    """Elimina el modelo entrenado para un número específico."""
    
    if numero not in CLASES_DISPONIBLES['numeros']:
        raise HTTPException(
            status_code=400, 
            detail=f"Número '{numero}' no válido"
        )
    
    try:
        await eliminar_modelo_clase(numero)
        return {
            "mensaje": f"Modelo del número '{numero}' eliminado exitosamente",
            "numero": numero,
            "categoria": "numeros"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando modelo: {str(e)}")

@router.get("/")
async def listar_numeros():
    """Lista todos los números disponibles con sus estadísticas."""
    
    return {
        "numeros_disponibles": CLASES_DISPONIBLES['numeros'],
        "total_numeros": len(CLASES_DISPONIBLES['numeros']),
        "categoria": "numeros"
    }