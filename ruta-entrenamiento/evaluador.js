// Python embedded as text so both GitHub Pages and file:// need no fetch/build.
globalThis.TRAINING_EVALUATOR = String.raw`
import ast as _ast
import builtins as _builtins
import json as _json
import operator as _operator
import time as _time
import traceback as _traceback
import reprlib as _reprlib

def _training_evaluate(code, tests='', stdin='', filename='ejercicio.py', notify=None):
    started = _time.perf_counter()
    cases = []
    error = None
    source_name = filename
    namespace = {'__name__': 'training_tests' if tests else '__main__',
                 '__builtins__': dict(vars(_builtins))}
    inputs = iter(stdin.split('\n') if stdin else [])

    def read_input(prompt=''):
        print(prompt, end='')
        try:
            answer = next(inputs)
        except StopIteration:
            raise EOFError('Faltan respuestas: completá Entradas para input(), una por línea')
        print(answer)
        return answer

    namespace['input'] = read_input

    def describe(value):
        # Bound representation of ordinary containers; retain useful small arrays.
        if isinstance(value, (list, tuple, dict, set, str)):
            printer = _reprlib.Repr()
            printer.maxlist = printer.maxtuple = printer.maxset = printer.maxdict = 32
            printer.maxstring = 1500
            return printer.repr(value)[:1500]
        return repr(value)[:1500]

    def exception_info(exc, source='student'):
        frames = _traceback.extract_tb(exc.__traceback__)
        frame = next((f for f in reversed(frames) if f.filename == filename), None)
        syntax = isinstance(exc, SyntaxError)
        return {
            'category': 'syntax' if syntax else 'logic' if isinstance(exc, AssertionError) else 'execution',
            'type': type(exc).__name__, 'message': str(exc)[:2000],
            'line': (getattr(exc, 'lineno', None) if syntax else frame.lineno if frame else None),
            'source': source,
        }

    def expression(node):
        return eval(compile(_ast.Expression(node), 'casos_entrenamiento.py', 'eval'), namespace)

    def is_exception_case(node):
        # Existing Puerto test: try/except/else raises AssertionError on missing exception.
        return isinstance(node, _ast.Try) and any(
            isinstance(n, _ast.Raise) and isinstance(n.exc, _ast.Call)
            and isinstance(n.exc.func, _ast.Name) and n.exc.func.id == 'AssertionError'
            for part in node.orelse for n in _ast.walk(part))

    def report():
        counts = {name: sum(c['status'] == name for c in cases) for name in ('passed', 'failed', 'skipped')}
        return _json.dumps({'mode': 'tests' if tests else 'run', 'cases': cases, 'total': len(cases),
                           **counts, 'error': error,
                           'durationMs': round((_time.perf_counter() - started) * 1000, 3)}, ensure_ascii=False)

    tree = None
    try:
        if tests:
            tree = _ast.parse(tests, 'casos_entrenamiento.py')
            for node in tree.body:
                if isinstance(node, _ast.Assert) or is_exception_case(node):
                    cases.append({'id': len(cases) + 1, 'input': _ast.unparse(node.test if isinstance(node, _ast.Assert) else node)[:2500],
                                  'expected': 'Condición verdadera', 'actual': 'No ejecutado',
                                  'status': 'skipped', 'error': None, 'durationMs': 0})
        if notify:
            notify(report())
        exec(compile(code, filename, 'exec'), namespace)
    except BaseException as exc:
        error = exception_info(exc, 'tests' if tree is None and tests and isinstance(exc, SyntaxError) and exc.filename == 'casos_entrenamiento.py' else 'student')

    if tree is not None and error is None:
        index = 0
        setup = []
        comparisons = {_ast.Eq: _operator.eq, _ast.NotEq: _operator.ne,
                       _ast.Is: _operator.is_, _ast.IsNot: _operator.is_not,
                       _ast.Lt: _operator.lt, _ast.LtE: _operator.le,
                       _ast.Gt: _operator.gt, _ast.GtE: _operator.ge,
                       _ast.In: lambda a, b: a in b, _ast.NotIn: lambda a, b: a not in b}
        symbols = {_ast.NotEq: 'distinto de ', _ast.IsNot: 'identidad distinta de ',
                   _ast.Lt: '< ', _ast.LtE: '≤ ', _ast.Gt: '> ', _ast.GtE: '≥ ',
                   _ast.In: 'pertenece a ', _ast.NotIn: 'no pertenece a '}
        for node in tree.body:
            if not (isinstance(node, _ast.Assert) or is_exception_case(node)):
                try:
                    exec(compile(_ast.Module(body=[node], type_ignores=[]), 'casos_entrenamiento.py', 'exec'), namespace)
                    setup.append(_ast.unparse(node))
                except BaseException as exc:
                    error = exception_info(exc, 'setup')
                    break
                continue
            case = cases[index]
            index += 1
            case_start = _time.perf_counter()
            if setup:
                case['input'] = ('Preparación y operaciones previas:\n' + '\n'.join(setup) + '\nComprobación:\n' + case['input'])[-2500:]
            try:
                if is_exception_case(node):
                    case['expected'] = 'Se lanza una excepción prevista por el contrato de este caso'
                    case['actual'] = 'Se lanzó la excepción prevista'
                    exec(compile(_ast.Module(body=[node], type_ignores=[]), 'casos_entrenamiento.py', 'exec'), namespace)
                    passed = True
                else:
                    test = node.test
                    if isinstance(test, _ast.Compare) and len(test.ops) == 1:
                        op = type(test.ops[0])
                        # Only inspect static literals before LHS; never reorder calls/side effects.
                        literal = False
                        try:
                            right = _ast.literal_eval(test.comparators[0])
                            literal = True
                            case['expected'] = symbols.get(op, '') + describe(right)
                        except (ValueError, TypeError):
                            pass
                        left = expression(test.left)
                        case['actual'] = describe(left)
                        if not literal:
                            right = expression(test.comparators[0])
                            case['expected'] = symbols.get(op, '') + describe(right)
                        passed = bool(comparisons[op](left, right))
                    elif (isinstance(test, _ast.Call) and isinstance(test.func, _ast.Attribute)
                          and isinstance(test.func.value, _ast.Name) and test.func.value.id == 'np'
                          and test.func.attr == 'array_equal' and len(test.args) == 2 and not test.keywords):
                        # np.array_equal: show arrays, rather than a bare False.
                        case['expected'] = _ast.unparse(test.args[1])
                        left, right = expression(test.args[0]), expression(test.args[1])
                        case['actual'], case['expected'] = describe(left), describe(right)
                        passed = bool(expression(test.func)(left, right))
                    else:
                        case['expected'] = 'True (la condición debe cumplirse)'
                        actual = expression(test)
                        case['actual'] = describe(actual)
                        passed = bool(actual)
                case['status'] = 'passed' if passed else 'failed'
                if not passed:
                    case['error'] = {'category': 'logic', 'type': 'AssertionError',
                                     'message': 'El resultado no cumple el contrato de este caso.',
                                     'line': None, 'source': 'tests'}
            except BaseException as exc:
                case['status'] = 'failed'
                case['error'] = exception_info(exc, 'tests')
                case['actual'] = (type(exc).__name__ + ': ' + str(exc))[:1500]
            case['durationMs'] = round((_time.perf_counter() - case_start) * 1000, 3)
            if notify:
                notify(report())

    return report()
`;
