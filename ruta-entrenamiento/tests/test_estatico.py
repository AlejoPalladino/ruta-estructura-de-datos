"""Checks static HTML semantics, without simulating a browser or screen reader."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('verify_markup', ROOT / 'ruta-entrenamiento/verificar.py')
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


class StaticMarkupTests(unittest.TestCase):
    def test_both_entrypoints_have_named_controls_and_valid_structure(self):
        for name in ('index.html', 'Guia primer parcial estructura de datos.html'):
            with self.subTest(name=name):
                verify.check_markup((ROOT / name).read_text(), name)

    def test_labels_and_aria_references_must_resolve(self):
        for markup in ('<input id="search">', '<label for="missing">Buscar</label>',
                       '<input aria-labelledby="missing">', '<button aria-controls="missing">Ver</button>',
                       '<textarea aria-describedby="missing" aria-label="Código"></textarea>'):
            with self.subTest(markup=markup), self.assertRaises(AssertionError):
                verify.check_markup(markup, 'fixture')
        verify.check_markup('<label>Estado<select><option>Nuevo</option></select></label>', 'implicit')
        verify.check_markup('<label for="x">Buscar</label><input id="x">', 'explicit')

    def test_bad_nesting_duplicate_ids_and_positive_tabindex_are_rejected(self):
        for markup in ('<div><span></div></span>', '<div>', '<p id="x"></p><p id="x"></p>',
                       '<button tabindex="2">Ir</button>'):
            with self.subTest(markup=markup), self.assertRaises(AssertionError):
                verify.check_markup(markup, 'fixture')


if __name__ == '__main__':
    unittest.main()
