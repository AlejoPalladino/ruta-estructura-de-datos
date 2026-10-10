"""Verifica integridad del material y los casos de entrenamiento (requiere NumPy)."""
from pathlib import Path
from html.parser import HTMLParser
import ast
import json
import re

ROOT = Path(__file__).resolve().parent.parent


def check_markup(html, filename):
    """Static structure/label checks; does not replace browser accessibility testing."""
    class Markup(HTMLParser):
        void = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
                'meta', 'param', 'source', 'track', 'wbr'}

        def __init__(self):
            super().__init__()
            self.stack, self.ids, self.labels, self.references, self.controls = [], set(), set(), [], []

        def handle_starttag(self, tag, attributes):
            attrs = dict(attributes)
            if attrs.get('id'):
                assert attrs['id'] not in self.ids, f'ID duplicado: {filename}: {attrs["id"]}'
                self.ids.add(attrs['id'])
            if tag == 'label' and attrs.get('for'):
                self.labels.add(attrs['for'])
                self.references.append(attrs['for'])
            for name in ('aria-controls', 'aria-describedby', 'aria-labelledby'):
                self.references.extend(attrs.get(name, '').split())
            if tag in {'input', 'select', 'textarea'}:
                self.controls.append((attrs, 'label' in self.stack))
            assert int(attrs.get('tabindex', 0)) <= 0, f'Tabindex positivo: {filename}'
            if tag not in self.void:
                self.stack.append(tag)

        def handle_endtag(self, tag):
            assert self.stack and self.stack[-1] == tag, f'Cierre HTML incorrecto: {filename}: {tag}'
            self.stack.pop()

    parser = Markup()
    parser.feed(html)
    parser.close()
    assert not parser.stack, f'Etiquetas sin cerrar: {filename}'
    assert all(ref in parser.ids for ref in parser.references), f'Referencia de etiqueta/ARIA ausente: {filename}'
    for attrs, implicit_label in parser.controls:
        assert implicit_label or attrs.get('id') in parser.labels or attrs.get('aria-label') or attrs.get('aria-labelledby'), f'Control sin etiqueta: {filename}: {attrs.get("id")}'


def main():
    source = (ROOT / 'ruta-entrenamiento/datos.js').read_text(encoding='utf-8')
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
        notebook = json.loads((ROOT / filename).read_text(encoding='utf-8'))
        book = next(book for book in data['books'] if book['file'] == filename)
        original_examples = [
            {'cell': index + 1, 'code': ''.join(cell['source'])}
            for index, cell in enumerate(notebook['cells'])
            if cell['cell_type'] == 'code' and ''.join(cell['source']).strip()
        ]
        assert book['examples'] == original_examples, f'Ejemplos originales alterados o ausentes: {filename}'
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
    app = (ROOT / 'ruta-entrenamiento/app.js').read_text(encoding='utf-8')
    learning_views = (ROOT / 'ruta-entrenamiento/aprendizaje-vistas.js').read_text(encoding='utf-8')
    html_files = ['index.html', 'Guia primer parcial estructura de datos.html']
    exam_views = (ROOT / 'ruta-entrenamiento/simulacros-vistas.js').read_text(encoding='utf-8')
    lab_views = (ROOT / 'ruta-entrenamiento/laboratorio-vistas.js').read_text(encoding='utf-8')
    expected_scripts = ['datos.js', 'aprendizaje.js', 'aprendizaje-vistas.js', 'simulacros.js', 'simulacros-vistas.js', 'taller.js', 'laboratorio.js', 'laboratorio-vistas.js', 'pedagogia.js', 'evaluador.js', 'runtime.js', 'mapa.js', 'app.js']
    for filename in html_files:
        html = (ROOT / filename).read_text(encoding='utf-8')
        check_markup(html, filename)
        html_ids = re.findall(r'id="([^"]+)"', html)
        assert len(html_ids) == len(set(html_ids)), f'Identificadores HTML duplicados: {filename}'
        for asset in re.findall(r'(?:src|href)="(ruta-entrenamiento/[^"]+)"', html):
            assert (ROOT / asset).is_file(), asset
        scripts = re.findall(r'<script defer src="ruta-entrenamiento/([^"]+)"', html)
        assert scripts == expected_scripts, f'Orden de carga incorrecto: {filename}'
        for element_id in re.findall(r"\$\('([^']+)'\)", app + learning_views + exam_views + lab_views):
            assert element_id in html_ids, f'Elemento ausente: {element_id} en {filename}'
    assert (ROOT / html_files[0]).read_bytes() == (ROOT / html_files[1]).read_bytes(), 'Los dos HTML difieren'
    print(f'OK: {len(exercises)} ejercicios; {numbered} consignas de notebooks; {len(material_files)} materiales.')
    print(f'OK: {sum(len(book["examples"]) for book in data["books"])} celdas de ejemplos idénticas a los notebooks originales.')
    print(f'OK: {tested} soluciones con pruebas; {assertions} aserciones; fuentes, plantillas y referencias HTML válidas.')
    print('OK: ambos HTML tienen estructura completa, controles etiquetados y referencias ARIA válidas.')
    print('La ejecución del motor en el navegador requiere una comprobación independiente con internet.')


if __name__ == '__main__':
    main()
