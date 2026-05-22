"""Local Fanju Modal package plus passthrough to the installed Modal SDK.

The repository needs `modal.platforms.*` for publish adapters, but running
`python3 -m modal ...` from the repo root would otherwise shadow the PyPI
`modal` package. This shim exposes SDK attributes while preserving local
submodules.
"""
from __future__ import annotations

import importlib
import sys
from pathlib import Path

_LOCAL_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _LOCAL_DIR.parent
_ORIGINAL_SYS_PATH = list(sys.path)


def _outside_repo(path_value: str) -> bool:
    try:
        path = Path(path_value or ".").resolve()
    except OSError:
        return False
    return path != _REPO_ROOT and _REPO_ROOT not in path.parents


def _load_sdk():
    filtered_path = [path for path in sys.path if _outside_repo(path)]
    current_module = sys.modules[__name__]
    try:
        sys.path = filtered_path
        sys.modules.pop(__name__, None)
        return importlib.import_module(__name__)
    finally:
        sys.modules[__name__] = current_module
        sys.path = _ORIGINAL_SYS_PATH


_SDK = _load_sdk()

for _name in dir(_SDK):
    if _name.startswith("__") and _name not in {"__version__"}:
        continue
    if _name in {"__path__", "__file__", "__spec__", "__package__"}:
        continue
    globals()[_name] = getattr(_SDK, _name)

__version__ = getattr(_SDK, "__version__", "")
__path__ = [str(_LOCAL_DIR), *[str(path) for path in getattr(_SDK, "__path__", [])]]
