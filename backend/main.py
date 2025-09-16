from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from utils import crear_directorios

# Crear la aplicación FastAPI
app = FastAPI(title="API de Reconocimiento de Vocales", version="1.0.0")

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

# Incluir las rutas
app.include_router(router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)