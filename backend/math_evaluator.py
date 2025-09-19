"""
Módulo para evaluar expresiones matemáticas a partir de símbolos reconocidos.
Maneja precedencia de operadores y devuelve pasos intermedios.
Incluye predicción de números por señas.
"""

import re
import requests
from typing import List, Dict, Union, Tuple
from decimal import Decimal, InvalidOperation

class MathEvaluator:
    """Evaluador de expresiones matemáticas con soporte para precedencia de operadores."""
    
    def __init__(self):
        # Definir precedencia de operadores (mayor número = mayor precedencia)
        self.precedencia = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2,
            '×': 2,  # Símbolo alternativo para multiplicación
            '÷': 2,  # Símbolo alternativo para división
        }
        
        # Mapeo de símbolos alternativos
        self.mapeo_simbolos = {
            '×': '*',
            '÷': '/',
            'mas': '+',
            'menos': '-',
            'por': '*',
            'entre': '/',
            'multiplicacion': '*',
            'division': '/',
            'suma': '+',
            'resta': '-'
        }
    
    def normalizar_simbolos(self, simbolos: List[str]) -> List[str]:
        """Normaliza los símbolos de entrada, convirtiendo palabras y símbolos alternativos."""
        simbolos_normalizados = []
        
        for simbolo in simbolos:
            simbolo_lower = simbolo.lower().strip()
            
            # Mapear símbolos alternativos
            if simbolo_lower in self.mapeo_simbolos:
                simbolos_normalizados.append(self.mapeo_simbolos[simbolo_lower])
            else:
                simbolos_normalizados.append(simbolo)
        
        return simbolos_normalizados
    
    def validar_expresion(self, simbolos: List[str]) -> Tuple[bool, str]:
        """Valida que la expresión sea matemáticamente correcta."""
        if not simbolos:
            return False, "Expresión vacía"
        
        # Verificar que empiece y termine con número
        if not self._es_numero(simbolos[0]):
            return False, "La expresión debe empezar con un número"
        
        if not self._es_numero(simbolos[-1]):
            return False, "La expresión debe terminar con un número"
        
        # Verificar alternancia número-operador-número
        for i, simbolo in enumerate(simbolos):
            if i % 2 == 0:  # Posiciones pares deben ser números
                if not self._es_numero(simbolo):
                    return False, f"Se esperaba un número en la posición {i + 1}, se encontró '{simbolo}'"
            else:  # Posiciones impares deben ser operadores
                if not self._es_operador(simbolo):
                    return False, f"Se esperaba un operador en la posición {i + 1}, se encontró '{simbolo}'"
        
        return True, "Expresión válida"
    
    def _es_numero(self, simbolo: str) -> bool:
        """Verifica si un símbolo es un número válido."""
        try:
            float(simbolo)
            return True
        except ValueError:
            return False
    
    def predecir_numero_por_senas(self, datos_imagen: str, base_url: str = "http://localhost:8000") -> Union[str, None]:
        """
        Predice un número a partir de datos de imagen usando el endpoint de números.
        
        Args:
            datos_imagen: Datos de la imagen en base64
            base_url: URL base del servidor API
            
        Returns:
            El número predicho como string o None si hay error
        """
        try:
            url = f"{base_url}/api/numeros/prediccion"
            payload = {"datos_imagen": datos_imagen}
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                resultado = response.json()
                if resultado.get("exito"):
                    return str(resultado.get("numero_predicho"))
                else:
                    print(f"Error en predicción: {resultado.get('error', 'Error desconocido')}")
                    return None
            else:
                print(f"Error HTTP {response.status_code}: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Error de conexión al predecir número: {e}")
            return None
        except Exception as e:
            print(f"Error inesperado al predecir número: {e}")
            return None
    
    def _es_operador(self, simbolo: str) -> bool:
        """Verifica si un símbolo es un operador válido."""
        return simbolo in self.precedencia
    
    def convertir_a_postfijo(self, simbolos: List[str]) -> List[str]:
        """Convierte una expresión infija a notación postfija usando el algoritmo Shunting Yard."""
        salida = []
        pila_operadores = []
        
        for simbolo in simbolos:
            if self._es_numero(simbolo):
                salida.append(simbolo)
            elif self._es_operador(simbolo):
                # Mientras haya operadores en la pila con mayor o igual precedencia
                while (pila_operadores and 
                       pila_operadores[-1] != '(' and
                       self.precedencia.get(pila_operadores[-1], 0) >= self.precedencia[simbolo]):
                    salida.append(pila_operadores.pop())
                pila_operadores.append(simbolo)
            elif simbolo == '(':
                pila_operadores.append(simbolo)
            elif simbolo == ')':
                # Vaciar hasta encontrar el paréntesis de apertura
                while pila_operadores and pila_operadores[-1] != '(':
                    salida.append(pila_operadores.pop())
                if pila_operadores:
                    pila_operadores.pop()  # Remover el '('
        
        # Vaciar la pila restante
        while pila_operadores:
            salida.append(pila_operadores.pop())
        
        return salida
    
    def evaluar_postfijo(self, expresion_postfijo: List[str]) -> Tuple[float, List[Dict]]:
        """Evalúa una expresión en notación postfija y devuelve el resultado con pasos."""
        pila = []
        pasos = []
        
        for simbolo in expresion_postfijo:
            if self._es_numero(simbolo):
                numero = float(simbolo)
                pila.append(numero)
                pasos.append({
                    "accion": "apilar_numero",
                    "simbolo": simbolo,
                    "valor": numero,
                    "pila": pila.copy()
                })
            elif self._es_operador(simbolo):
                if len(pila) < 2:
                    raise ValueError(f"Operador '{simbolo}' requiere dos operandos")
                
                b = pila.pop()
                a = pila.pop()
                
                if simbolo == '+':
                    resultado = a + b
                elif simbolo == '-':
                    resultado = a - b
                elif simbolo == '*':
                    resultado = a * b
                elif simbolo == '/':
                    if b == 0:
                        raise ValueError("División por cero")
                    resultado = a / b
                else:
                    raise ValueError(f"Operador desconocido: {simbolo}")
                
                pila.append(resultado)
                pasos.append({
                    "accion": "evaluar_operacion",
                    "operador": simbolo,
                    "operando_a": a,
                    "operando_b": b,
                    "resultado": resultado,
                    "expresion": f"{a} {simbolo} {b} = {resultado}",
                    "pila": pila.copy()
                })
        
        if len(pila) != 1:
            raise ValueError("Expresión malformada")
        
        return pila[0], pasos
    
    def evaluar(self, simbolos: List[str]) -> Dict:
        """Evalúa una expresión matemática completa y devuelve resultado detallado."""
        try:
            # Normalizar símbolos
            simbolos_normalizados = self.normalizar_simbolos(simbolos)
            
            # Validar expresión
            es_valida, mensaje = self.validar_expresion(simbolos_normalizados)
            if not es_valida:
                return {
                    "exito": False,
                    "error": mensaje,
                    "simbolos_originales": simbolos,
                    "simbolos_normalizados": simbolos_normalizados
                }
            
            # Convertir a postfijo
            expresion_postfijo = self.convertir_a_postfijo(simbolos_normalizados)
            
            # Evaluar
            resultado, pasos = self.evaluar_postfijo(expresion_postfijo)
            
            return {
                "exito": True,
                "resultado": resultado,
                "simbolos_originales": simbolos,
                "simbolos_normalizados": simbolos_normalizados,
                "expresion_infija": " ".join(simbolos_normalizados),
                "expresion_postfijo": expresion_postfijo,
                "pasos": pasos,
                "total_operaciones": len([p for p in pasos if p["accion"] == "evaluar_operacion"])
            }
            
        except Exception as e:
            return {
                "exito": False,
                "error": str(e),
                "simbolos_originales": simbolos,
                "simbolos_normalizados": simbolos_normalizados if 'simbolos_normalizados' in locals() else []
            }

# Instancia global del evaluador
evaluador_matematico = MathEvaluator()

def evaluar_expresion_matematica(simbolos: List[str]) -> Dict:
    """Función de conveniencia para evaluar una expresión matemática."""
    return evaluador_matematico.evaluar(simbolos)

def predecir_numero_desde_imagen(datos_imagen: str, base_url: str = "http://localhost:8000") -> Union[str, None]:
    """
    Función de conveniencia para predecir un número desde una imagen usando señas.
    
    Args:
        datos_imagen: Datos de la imagen en base64
        base_url: URL base del servidor API
        
    Returns:
        El número predicho como string o None si hay error
    """
    return evaluador_matematico.predecir_numero_por_senas(datos_imagen, base_url)

def evaluar_expresion_con_prediccion_numeros(imagenes_numeros: List[str], simbolos_operadores: List[str], base_url: str = "http://localhost:8000") -> Dict:
    """
    Evalúa una expresión matemática donde los números se predicen desde imágenes de señas.
    
    Args:
        imagenes_numeros: Lista de imágenes en base64 que representan números
        simbolos_operadores: Lista de operadores matemáticos
        base_url: URL base del servidor API
        
    Returns:
        Diccionario con el resultado de la evaluación
    """
    try:
        # Predecir números desde las imágenes
        numeros_predichos = []
        for i, imagen in enumerate(imagenes_numeros):
            numero_predicho = predecir_numero_desde_imagen(imagen, base_url)
            if numero_predicho is None:
                return {
                    "exito": False,
                    "error": f"No se pudo predecir el número de la imagen {i + 1}",
                    "imagenes_procesadas": i,
                    "numeros_predichos": numeros_predichos
                }
            numeros_predichos.append(numero_predicho)
        
        # Construir la expresión completa intercalando números y operadores
        expresion_completa = []
        for i in range(len(numeros_predichos)):
            expresion_completa.append(numeros_predichos[i])
            if i < len(simbolos_operadores):
                expresion_completa.append(simbolos_operadores[i])
        
        # Evaluar la expresión matemática
        resultado_evaluacion = evaluar_expresion_matematica(expresion_completa)
        
        # Agregar información adicional sobre la predicción
        resultado_evaluacion["numeros_predichos"] = numeros_predichos
        resultado_evaluacion["total_imagenes_procesadas"] = len(imagenes_numeros)
        resultado_evaluacion["operadores_utilizados"] = simbolos_operadores
        
        return resultado_evaluacion
        
    except Exception as e:
        return {
            "exito": False,
            "error": f"Error al evaluar expresión con predicción de números: {str(e)}",
            "numeros_predichos": numeros_predichos if 'numeros_predichos' in locals() else [],
            "total_imagenes_procesadas": len(imagenes_numeros) if imagenes_numeros else 0
        }