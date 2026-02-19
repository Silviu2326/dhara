import csv
import json
import sys

def csv_to_therapies_json(csv_path, json_path):
    therapies = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        next(reader)
        for row in reader:
            if len(row) < 9 or not row[1].strip():
                continue
            therapy = {
                "term": row[1].strip(),
                "definition": row[2].strip(),
                "fundpilar": row[3].strip(),
                "queTrata": row[4].strip(),
                "publicoRecomendado": row[5].strip(),
                "contraindicaciones": row[6].strip(),
                "comoEsSesion": row[7].strip(),
                "complementariaCon": row[8].strip() if len(row) > 8 else ""
            }
            therapies.append(therapy)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(therapies, f, ensure_ascii=False, indent=2)
    print(f"Se exportaron {len(therapies)} terapias a {json_path}")

if __name__ == "__main__":
    csv_file = "Diccionario Excel.xlsx - Hoja1.csv"
    json_file = "src/clientes/data/therapies.json"
    import os
    os.makedirs(os.path.dirname(json_file), exist_ok=True)
    csv_to_therapies_json(csv_file, json_file)
