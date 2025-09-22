# Configuración de clases disponibles para el sistema de reconocimiento

# Definición de todas las clases organizadas por categoría
CLASES_DISPONIBLES = {
    "vocales": ["a", "e", "i", "o", "u"],
    "numeros": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    "operaciones": ["mas", "menos", "multiplicacion", "division"],  # 👈 nombres humanos
}

# Lista plana de todas las clases para validación
TODAS_LAS_CLASES = []
for categoria, clases in CLASES_DISPONIBLES.items():
    TODAS_LAS_CLASES.extend(clases)

# Mapeo de clase a categoría
CLASE_A_CATEGORIA = {}
for categoria, clases in CLASES_DISPONIBLES.items():
    for clase in clases:
        CLASE_A_CATEGORIA[clase] = categoria

# 🔄 Mapeo de operaciones (nombre humano → símbolo)
MAPEO_OPS = {
    "mas": "+",
    "menos": "-",
    "multiplicacion": "*",
    "division": "/",
}

# Configuración de datos
DATOS_CONFIG = {
    "samples_minimos": 2,
    "samples_recomendados": 100,
    "samples_maximos": 100,
}

# Rutas de directorios
RUTAS = {
    "data_base": "backend/data",
    "models_base": "backend/models_trained",
    "data_vocales": "backend/data/vocales",
    "data_numeros": "backend/data/numeros",
    "data_operaciones": "backend/data/operaciones",
}

def obtener_ruta_datos(clase):
    """Obtiene la ruta donde se almacenan los datos de una clase específica"""
    categoria = CLASE_A_CATEGORIA.get(clase)
    if not categoria:
        raise ValueError(f"Clase '{clase}' no reconocida")
    
    return f"{RUTAS['data_base']}/{categoria}/{clase}_samples.json"

def obtener_ruta_modelo(clase):
    """Obtiene la ruta donde se almacena el modelo entrenado de una clase específica"""
    return f"{RUTAS['models_base']}/{clase}_model.h5"

def obtener_ruta_encoder(clase):
    """Obtiene la ruta donde se almacena el label encoder de una clase específica"""
    return f"{RUTAS['models_base']}/{clase}_encoder.pkl"

def validar_clase(clase):
    """Valida si una clase es válida"""
    return clase in TODAS_LAS_CLASES

def obtener_clases_por_categoria(categoria):
    """Obtiene todas las clases de una categoría específica"""
    return CLASES_DISPONIBLES.get(categoria, [])
