# Usa una imagen base de Python que sea compatible con tu version de TensorFlow
FROM python:3.10-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia el archivo requirements.txt y lo instala
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia el resto del codigo de tu backend
COPY backend/ .

# Define el comando para ejecutar tu aplicacion
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]vicorn", "main:app", "--host", "0.0.0.0", "--port", "$PORT"]