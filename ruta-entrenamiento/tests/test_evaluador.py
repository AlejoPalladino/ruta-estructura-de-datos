"""Tests against the exact Python text shipped to the worker (Python + NumPy)."""
import json
import contextlib
import io
from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
RESOURCE = ROOT / 'ruta-entrenamiento/evaluador.js'
source = RESOURCE.read_text().split('String.raw`', 1)[1].rsplit('`;', 1)[0]
scope = {}
exec(compile(source, str(RESOURCE), 'exec'), scope)
evaluate = scope['_training_evaluate']


def run(code, tests='', stdin=''):
    with contextlib.redirect_stdout(io.StringIO()):
        return json.loads(evaluate(code, tests, stdin))


class EvaluatorTests(unittest.TestCase):
    def test_all_original_solutions_and_extended_cases(self):
        command = "const fs=require('fs'),p=require('./ruta-entrenamiento/pedagogia.js');const d=JSON.parse(fs.readFileSync('ruta-entrenamiento/datos.js','utf8').replace(/^window.TRAINING_DATA = /,'').replace(/;\\s*$/,''));console.log(JSON.stringify(d.exercises.filter(e=>e.tests).map(e=>({id:e.id,solution:e.solution,tests:p.testsFor(e)}))));"
        exercises = json.loads(subprocess.check_output(['node', '-e', command], cwd=ROOT))
        total = 0
        for ex in exercises:
            with self.subTest(exercise=ex['id']):
                result = run(ex['solution'], ex['tests'])
                self.assertIsNone(result['error'])
                self.assertEqual(result['passed'], result['total'])
                self.assertEqual(result['failed'], 0)
                self.assertGreaterEqual(result['durationMs'], 0)
                total += result['total']
        self.assertEqual(len(exercises), 17)
        self.assertGreater(total, 65)

    def test_failures_do_not_abort_next_cases_or_repeat_calls(self):
        code = 'calls = 0\ndef f(n):\n global calls\n calls += 1\n return n'
        result = run(code, 'assert f(1) == 2\nassert f(3) == 3\nassert calls == 2')
        self.assertEqual((result['passed'], result['failed']), (2, 1))
        self.assertEqual(result['cases'][0]['actual'], '1')
        self.assertEqual(result['cases'][0]['expected'], '2')
        self.assertEqual(result['cases'][0]['error']['category'], 'logic')

    def test_numpy_results_show_arrays(self):
        result = run('import numpy as np\ndef f(): return np.array([[2,3]])', 'assert np.array_equal(f(), [[1,3]])')
        self.assertEqual(result['failed'], 1)
        self.assertIn('2', result['cases'][0]['actual'])
        self.assertEqual(result['cases'][0]['expected'], '[[1, 3]]')

    def test_runtime_case_failure_continues_and_points_to_student(self):
        result = run('def f(n):\n return [1][n]', 'assert f(2) == 1\nassert f(0) == 1')
        self.assertEqual(result['passed'], 1)
        self.assertEqual(result['cases'][0]['error']['type'], 'IndexError')
        self.assertEqual(result['cases'][0]['error']['line'], 2)

    def test_syntax_and_initialization_errors_skip_cases(self):
        for code, category in [('def f(: pass', 'syntax'), ('x = 1/0', 'execution')]:
            with self.subTest(code=code):
                result = run(code, 'assert f(0) == 1\nassert f(1) == 2')
                self.assertEqual(result['skipped'], 2)
                self.assertEqual(result['failed'], 0)
                self.assertEqual(result['error']['category'], category)
        result = run('pass', 'a = MissingClass()\nassert a.x == 1')
        self.assertEqual(result['error']['source'], 'setup')
        self.assertEqual(result['skipped'], 1)

    def test_shared_tda_state_and_expected_exception(self):
        tests = 'items = []\nitems.append(4)\nassert items == [3]\nassert len(items) == 1\ntry:\n raise ValueError("lleno")\nexcept Exception:\n pass\nelse:\n raise AssertionError("se esperaba excepción")'
        result = run('', tests)
        self.assertEqual((result['passed'], result['failed'], result['total']), (2, 1, 3))
        self.assertIn('items.append(4)', result['cases'][1]['input'])
        tests = tests.replace('raise ValueError("lleno")', 'pass')
        result = run('', tests)
        self.assertEqual(result['failed'], 2)
        self.assertEqual(result['cases'][2]['error']['category'], 'logic')

    def test_input_main_guard_and_fresh_namespace(self):
        result = run('assert input() == "7"', stdin='7')
        self.assertIsNone(result['error'])
        self.assertEqual(run('input()')['error']['type'], 'EOFError')
        code = 'def f(): return 1\nif __name__ == "__main__": raise ValueError("demo")'
        self.assertEqual(run(code, 'assert f() == 1')['passed'], 1)
        self.assertEqual(run(code)['error']['type'], 'ValueError')
        run('private = 123')
        self.assertEqual(run('private')['error']['type'], 'NameError')

    def test_system_exit_and_bad_test_syntax_become_reports(self):
        self.assertEqual(run('raise SystemExit(0)')['error']['type'], 'SystemExit')
        self.assertEqual(run('', 'assert (')['error']['source'], 'tests')

    def test_progress_preserves_completed_and_pending_cases(self):
        updates = []
        result = json.loads(evaluate('def f(n): return n', 'assert f(1) == 1\nassert f(2) == 3', notify=lambda s: updates.append(json.loads(s))))
        self.assertEqual(updates[0]['skipped'], 2)
        self.assertEqual(updates[1]['passed'], 1)
        self.assertEqual(updates[1]['skipped'], 1)
        self.assertEqual(updates[-1]['failed'], result['failed'])


if __name__ == '__main__':
    unittest.main()
