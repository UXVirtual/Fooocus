import numbers
import os
import tempfile
import unittest

import modules.flags
from modules import extra_utils


class TestUtils(unittest.TestCase):
    def test_try_eval_env_var(self):
        test_cases = [
            {
                "input": ("foo", str),
                "output": "foo"
            },
            {
                "input": ("1", int),
                "output": 1
            },
            {
                "input": ("1.0", float),
                "output": 1.0
            },
            {
                "input": ("1", numbers.Number),
                "output": 1
            },
            {
                "input": ("1.0", numbers.Number),
                "output": 1.0
            },
            {
                "input": ("true", bool),
                "output": True
            },
            {
                "input": ("True", bool),
                "output": True
            },
            {
                "input": ("false", bool),
                "output": False
            },
            {
                "input": ("False", bool),
                "output": False
            },
            {
                "input": ("True", str),
                "output": "True"
            },
            {
                "input": ("False", str),
                "output": "False"
            },
            {
                "input": ("['a', 'b', 'c']", list),
                "output": ['a', 'b', 'c']
            },
            {
                "input": ("{'a':1}", dict),
                "output": {'a': 1}
            },
            {
                "input": ("('foo', 1)", tuple),
                "output": ('foo', 1)
            }
        ]

        for test in test_cases:
            value, expected_type = test["input"]
            expected = test["output"]
            actual = extra_utils.try_eval_env_var(value, expected_type)
            self.assertEqual(expected, actual)

    def test_try_eval_env_var_does_not_execute_expressions(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            marker_file = os.path.join(temp_dir, "marker.txt")
            malicious_expression = f"__import__('pathlib').Path({marker_file!r}).write_text('pwned')"

            actual = extra_utils.try_eval_env_var(malicious_expression, list)

            self.assertEqual(malicious_expression, actual)
            self.assertFalse(os.path.exists(marker_file))
