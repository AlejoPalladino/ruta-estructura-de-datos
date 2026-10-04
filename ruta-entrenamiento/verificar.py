"""Verifica integridad del material y los casos de entrenamiento (requiere NumPy)."""
from pathlib import Path
import ast
import json
import re

ROOT = Path(__file__).resolve().parent.parent


def main():
    source = (ROOT / 'ruta-entrenamiento/datos.js').read_text()
    data = json.loads(source.removeprefix('window.TRAINING_DATA = ').strip().removesuffix(';'))
    exercises = data['exercises']
    ids = {exercise['id'] for exercise in exercises}
    assert len(ids) == len(exercises), 'Hay identificadores duplicados'
    material_files = {material['file'] for material in data['materials']}
    expected_files = {p.name for p in ROOT.iterdir() if p.suffix in {'.pdf', '.docx', '.ipynb', '.py'}}
    assert material_files == expected_files, 'La biblioteca no coincide con los archivos de la carpeta'
    for filename in material_files:
        assert (ROOT / filename).is_file(), filename
    # Independent inventory, checked against the source notebooks.
    expected_notebooks = {
        'TP_1_Introducción_a_Python_parte_1_Com_5.ipynb': [str(n) for n in range(1, 33)] + ['15bis'],
        'TP_1_Introducción_a_Python_parte_2_Com_5.ipynb': [str(n) for n in range(1, 15)],
        'TP_2_Arreglos_Com_5.ipynb': [str(n) for n in range(1, 9)] + ['12', '12b', '13', '14', '15', '16'],
        'TP_3__Tipos_de_datos_Abstractos_Com_5.ipynb': [str(n) for n in range(1, 10)],
        'TP_4_Recursividad_Com_5.ipynb': [str(n) for n in range(1, 20)],
        'TP_5_Pila_Cola_Com_5.ipynb': [str(n) for n in range(1, 19)],
        'TP5bis_Pila_Cola_TDA_Com_5.ipynb': ['1', '2', '3', '4'],
        'TP_6_Diccionario_Conjunto.ipynb': [str(n) for n in range(1, 15)],
        'Practica_Parcial_1.ipynb': ['1', '2'],
    }
    numbered = 0
    assert {book['file'] for book in data['books']} == set(expected_notebooks)
    for filename, numbers in expected_notebooks.items():
        expected_ids = {Path(filename).stem + '-' + num for num in numbers}
        actual_ids = {exercise['id'] for exercise in exercises if exercise['source'] == filename}
        assert actual_ids == expected_ids, f'Consignas faltantes o sobrantes en {filename}'
        notebook = json.loads((ROOT / filename).read_text())
        for exercise in exercises:
            if exercise['source'] != filename:
                continue
            cell_index = int(exercise['sourceLabel'].rsplit(' ', 1)[1]) - 1
            original = ''.join(notebook['cells'][cell_index]['source'])
            assert exercise['statement'] == original.split('\n', 1)[1].strip(), exercise['id']
        numbered += len(numbers)
    tested = assertions = 0
    for exercise in exercises:
        assert exercise['starter'], f'Falta plantilla: {exercise["id"]}'
        if exercise['source']:
            assert exercise['source'] in material_files, exercise['source']
        if exercise['solution']:
            compile(exercise['solution'], exercise['id'], 'exec')
        if not exercise['tests']:
            continue
        namespace = {'__name__': 'training_tests'}
        exec(compile(exercise['solution'], exercise['id'], 'exec'), namespace)
        exec(compile(exercise['tests'], 'casos_' + exercise['id'], 'exec'), namespace)
        tested += 1
        assertions += sum(isinstance(node, ast.Assert) for node in ast.walk(ast.parse(exercise['tests'])))
    html = (ROOT / 'Guia primer parcial estructura de datos.html').read_text()
    html_ids = re.findall(r'id="([^"]+)"', html)
    assert len(html_ids) == len(set(html_ids)), 'Identificadores HTML duplicados'
    for asset in re.findall(r'(?:src|href)="(ruta-entrenamiento/[^"]+)"', html):
        assert (ROOT / asset).is_file(), asset
    app = (ROOT / 'ruta-entrenamiento/app.js').read_text()
    for element_id in re.findall(r"\$\('([^']+)'\)", app):
        assert element_id in html_ids, f'Elemento ausente: {element_id}'
    print(f'OK: {len(exercises)} ejercicios; {numbered} consignas de notebooks; {len(material_files)} materiales.')
    print(f'OK: {tested} soluciones con pruebas; {assertions} aserciones; fuentes, plantillas y referencias HTML válidas.')
    print('La ejecución del motor en el navegador requiere una comprobación independiente con internet.')


if __name__ == '__main__':
    main()
