from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from datetime import datetime

from models import entrenar_modelo, predecir_vocal, eliminar_modelo
from utils import (
    guardar_cola_en_disco, obtener_progreso, calcular_estadisticas_totales,
    verificar_datos_suficientes, eliminar_todos_los_datos, VOCALES, MAX_MUESTRAS
)

# Crear el router
router = APIRouter()

# --- Modelos de datos ---
class DatosMuestra(BaseModel):
    vocal: str
    puntos_clave: List[List[float]]
    fecha_hora: Optional[str] = None

class SolicitudPrediccion(BaseModel):
    puntos_clave: List[List[float]]

# --- Variables globales ---
cola_muestras = {vocal: [] for vocal in VOCALES}
esta_guardando = {vocal: False for vocal in VOCALES}

# --- Funciones auxiliares ---
async def tarea_guardar_cola_en_disco(vocal: str):
    """Tarea de fondo para guardar las muestras en lotes."""
    esta_guardando[vocal] = True
    try:
        # Esperar un poco para agrupar más muestras
        await asyncio.sleep(1) 
        
        cola_a_guardar = cola_muestras[vocal]
        cola_muestras[vocal] = []  # Limpiar la cola en memoria
        
        if cola_a_guardar:
            guardar_cola_en_disco(vocal, cola_a_guardar)
    finally:
        esta_guardando[vocal] = False

# --- Endpoints de la API ---
@router.get("/")
async def raiz():
    """Endpoint principal de la API."""
    return {"mensaje": "API de Reconocimiento de Vocales", "estado": "funcionando"}

@router.post("/api/samples")
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

@router.get("/api/progress")
async def obtener_progreso_recoleccion():
    """Devuelve el progreso de recolección de todas las vocales."""
    try:
        progreso = obtener_progreso()
        for vocal in VOCALES:
            progreso[vocal]["cantidad"] += len(cola_muestras[vocal])
            progreso[vocal]["porcentaje"] = min(100, (progreso[vocal]["cantidad"] / MAX_MUESTRAS) * 100)
        
        estadisticas_totales = calcular_estadisticas_totales(progreso)
        
        return {
            "vocales": progreso,
            "total": estadisticas_totales
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/train")
async def entrenar_modelo_endpoint():
    """Entrena el modelo de clasificación con los datos recolectados."""
    try:
        print("Iniciando entrenamiento...")
        datos_insuficientes = verificar_datos_suficientes()
        print(f"Datos insuficientes: {datos_insuficientes}")
        
        if datos_insuficientes:
            raise HTTPException(
                status_code=400, 
                detail=f"Datos insuficientes para: {', '.join(datos_insuficientes)}. Recolecta al menos 2 muestras para cada vocal."
            )
        
        print("Llamando a entrenar_modelo()...")
        resultado = entrenar_modelo()
        print(f"Resultado del entrenamiento: {resultado}")
        
        return {
            "mensaje": "Entrenamiento completado ✅",
            **resultado
        }
    
    except ValueError as e:
        print(f"Error de valor en entrenamiento: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error de valor: {str(e)}")
    except Exception as e:
        print(f"Error general en entrenamiento: {e}")
        import traceback
        traceback.print_exc()
        error_message = str(e) if str(e) else "Error desconocido durante el entrenamiento"
        raise HTTPException(status_code=500, detail=f"Error interno: {error_message}")

@router.get("/api/test")
async def test_endpoint():
    """Endpoint de prueba para verificar funcionamiento."""
    try:
        from models import preparar_datos_entrenamiento
        X, y = preparar_datos_entrenamiento()
        return {
            "mensaje": "Test exitoso",
            "datos_cargados": len(X),
            "vocales": list(set(y)) if len(y) > 0 else []
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "traceback": traceback.format_exc()}

@router.post("/api/predict")
async def predecir_vocal_endpoint(datos: SolicitudPrediccion):
    """Predice la vocal basada en los puntos clave proporcionados."""
    try:
        resultado = predecir_vocal(datos.puntos_clave)
        return resultado
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/reset")
async def reiniciar_datos():
    """Reinicia todos los datos de recolección y el modelo entrenado."""
    try:
        # Limpiar colas en memoria
        for vocal in VOCALES:
            cola_muestras[vocal] = []
        
        # Eliminar datos del disco
        eliminar_todos_los_datos()
        
        # Eliminar modelo entrenado
        eliminar_modelo()
        
        return {
            "mensaje": "Datos reiniciados correctamente",
            "progreso": obtener_progreso()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/samples/{vocal}")
async def eliminar_datos_vocal_endpoint(vocal: str):
    """Elimina los datos de una vocal específica."""
    try:
        vocal_mayus = vocal.upper()
        
        if vocal_mayus not in VOCALES:
            raise HTTPException(status_code=400, detail=f"Vocal '{vocal_mayus}' no válida. Debe ser una de: {', '.join(VOCALES)}")
        
        # Limpiar cola en memoria
        cola_muestras[vocal_mayus] = []
        
        # Eliminar datos del disco
        from utils import eliminar_datos_vocal
        eliminar_datos_vocal(vocal_mayus)
        
        return {
            "mensaje": f"Datos de la vocal '{vocal_mayus}' eliminados correctamente",
            "progreso": obtener_progreso()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))