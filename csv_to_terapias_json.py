#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para convertir el diccionario de terapias CSV a JSON.
Lee 'Diccionario Excel.xlsx - Hoja1.csv' y genera 'terapias.json'.
"""

import csv
import json
import re
import sys

# Configurar codificación para Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


def limpiar_texto(texto):
    """Limpia el texto eliminando espacios extra y caracteres problemáticos."""
    if not texto:
        return ""
    # Eliminar espacios al inicio y final
    texto = texto.strip()
    # Normalizar espacios múltiples
    texto = re.sub(r'\s+', ' ', texto)
    return texto


def parsear_numero(valor):
    """Extrae el número de terapia del formato '1.' o similar."""
    if not valor:
        return None
    match = re.match(r'(\d+)', valor.strip())
    return int(match.group(1)) if match else None


def convertir_csv_a_json(archivo_csv, archivo_json):
    """Convierte el archivo CSV de terapias a JSON estructurado."""
    
    terapias = []
    
    with open(archivo_csv, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        filas = list(reader)
    
    if len(filas) < 3:
        print("Error: El archivo CSV no tiene suficientes filas")
        return
    
    # Fila 0: Encabezados principales
    # Fila 1: Sub-encabezados (Definición, Fundamento, etc.)
    encabezados = filas[1]
    
    print(f"Columnas detectadas: {len(encabezados)}")
    print(f"Encabezados: {encabezados}")
    
    # Procesar filas de datos (desde la fila 2)
    for i, fila in enumerate(filas[2:], start=3):
        if not fila or all(not celda.strip() for celda in fila):
            continue  # Saltar filas vacías
        
        # Asegurar que tengamos suficientes columnas
        while len(fila) < len(encabezados):
            fila.append("")
        
        # Extraer campos según la estructura del CSV
        numero_raw = fila[0] if len(fila) > 0 else ""
        nombre = fila[1] if len(fila) > 1 else ""
        descripcion_general = fila[2] if len(fila) > 2 else ""
        
        # El resto de columnas son los campos detallados
        definicion = fila[3] if len(fila) > 3 else ""
        fundamento = fila[4] if len(fila) > 4 else ""
        que_trata = fila[5] if len(fila) > 5 else ""
        publico_recomendado = fila[6] if len(fila) > 6 else ""
        contraindicaciones = fila[7] if len(fila) > 7 else ""
        como_es_sesion = fila[8] if len(fila) > 8 else ""
        complementaria_con = fila[9] if len(fila) > 9 else ""
        
        # Solo procesar si tiene nombre
        if not nombre.strip():
            continue
        
        terapia = {
            "id": parsear_numero(numero_raw),
            "nombre": limpiar_texto(nombre),
            "descripcion_corta": limpiar_texto(descripcion_general),
            "definicion": limpiar_texto(definicion),
            "fundamento": limpiar_texto(fundamento),
            "que_trata": limpiar_texto(que_trata),
            "publico_recomendado": limpiar_texto(publico_recomendado),
            "contraindicaciones": limpiar_texto(contraindicaciones),
            "como_es_una_sesion": limpiar_texto(como_es_sesion),
            "complementaria_con": limpiar_texto(complementaria_con)
        }
        
        terapias.append(terapia)
        print(f"Procesada terapia {terapia['id']}: {terapia['nombre']}")
    
    # Crear estructura final
    resultado = {
        "metadata": {
            "total_terapias": len(terapias),
            "fuente": "Diccionario Excel.xlsx - Hoja1.csv",
            "formato": "JSON estructurado"
        },
        "terapias": terapias
    }
    
    # Guardar JSON
    with open(archivo_json, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Conversión completada!")
    print(f"   - Terapias procesadas: {len(terapias)}")
    print(f"   - Archivo generado: {archivo_json}")


if __name__ == "__main__":
    archivo_csv = "Diccionario Excel.xlsx - Hoja1.csv"
    archivo_json = "terapias.json"
    
    convertir_csv_a_json(archivo_csv, archivo_json)
