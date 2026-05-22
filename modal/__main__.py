from __future__ import annotations

import sys

from ._traceback import reduce_traceback_to_user_code
from .cli._traceback import highlight_modal_warnings, setup_rich_traceback
from .cli.entry_point import entrypoint_cli
from .cli.import_refs import _CliUserExecutionError
from .config import config
from .output import enable_output


def main() -> None:
    setup_rich_traceback()
    highlight_modal_warnings()

    with enable_output():
        try:
            entrypoint_cli()
        except _CliUserExecutionError as exc:
            if config.get("traceback"):
                raise

            assert exc.__cause__
            tb = reduce_traceback_to_user_code(exc.__cause__.__traceback__, exc.user_source)
            sys.excepthook(type(exc.__cause__), exc.__cause__, tb)
            sys.exit(1)


if __name__ == "__main__":
    main()
