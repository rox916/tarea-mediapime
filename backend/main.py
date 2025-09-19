from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.routes_generales import router as router_general
from routes.vocales.routes_vocales import router as router_vocales
from routes.numeros.routes_numeros import router as router_numeros
from routes.operaciones.routes_operaciones import router as router_operaciones
from utils import crear_directorios

# Crear la aplicación FastAPI
app = FastAPI(
    title="MediaPipe API Collection", 
    version="1.0.0",
    description="API para recolección de datos y entrenamiento de modelos con MediaPipe"
)

# Configurar CORS para permitir peticiones desde cualquier origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorios necesarios
crear_directorios()

# Incluir las rutas organizadas por funcionalidad
app.include_router(router_general)      # Rutas generales: /api/...
app.include_router(router_vocales)      # Rutas de vocales: /api/vocales/...
app.include_router(router_numeros)      # Rutas de números: /api/numeros/...
app.include_router(router_operaciones)  # Rutas de operaciones: /api/operaciones/...



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)