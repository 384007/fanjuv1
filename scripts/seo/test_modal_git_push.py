import importlib
import subprocess
import sys
import types
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[2]))


class _DummyApp:
    def __init__(self, *args, **kwargs):
        pass

    def function(self, *args, **kwargs):
        def decorator(fn):
            return fn
        return decorator


class _DummySecret:
    @staticmethod
    def from_name(*args, **kwargs):
        return object()


class _DummyVolume:
    @staticmethod
    def from_name(*args, **kwargs):
        return object()


class _DummyImage:
    @staticmethod
    def debian_slim(*args, **kwargs):
        return _DummyImage()

    def apt_install(self, *args, **kwargs):
        return self

    def run_commands(self, *args, **kwargs):
        return self

    def add_local_dir(self, *args, **kwargs):
        return self


def _install_modal_stub():
    sys.modules["modal"] = types.SimpleNamespace(
        App=_DummyApp,
        Secret=_DummySecret,
        Volume=_DummyVolume,
        Image=_DummyImage,
        Cron=lambda *args, **kwargs: object(),
    )


_install_modal_stub()
agent = importlib.import_module("modal_growth_agent")


def cp(args, code=0, stdout="", stderr=""):
    return subprocess.CompletedProcess(args, code, stdout, stderr)


class PushRetryTests(unittest.TestCase):
    def setUp(self):
        self.original_run_capture = agent.run_capture
        self.original_run_args_capture = agent.run_args_capture
        self.original_git_blob_at = agent.git_blob_at
        self.original_abort_rebase = agent.abort_rebase

    def tearDown(self):
        agent.run_capture = self.original_run_capture
        agent.run_args_capture = self.original_run_args_capture
        agent.git_blob_at = self.original_git_blob_at
        agent.abort_rebase = self.original_abort_rebase

    def _patch_git(self, push_results, rebase_result=None):
        commands = []
        pushes = list(push_results)

        def fake_run_capture(args, cwd=None, timeout=300):
            commands.append(args)
            if args == ["git", "rev-parse", "HEAD"]:
                return "abc123commit"
            if args == ["git", "rev-parse", "origin/main"]:
                return "remote123commit"
            if args == ["git", "branch", "--show-current"]:
                return "main"
            raise AssertionError(f"unexpected run_capture: {args}")

        def fake_run_args_capture(args, cwd=None, timeout=300, redacted=None):
            commands.append(args)
            if args == ["git", "push", "origin", "main"]:
                if not pushes:
                    return cp(args)
                return pushes.pop(0)
            if args == ["git", "fetch", "origin", "main"]:
                return cp(args)
            if args == ["git", "rebase", "--autostash", "origin/main"]:
                return rebase_result if rebase_result is not None else cp(args)
            if args == ["git", "status", "--short"]:
                return cp(args, stdout="UU content/seo-ready/example.md\n")
            if args == ["git", "diff", "--name-only", "--diff-filter=U"]:
                return cp(args, stdout="content/seo-ready/example.md\n")
            raise AssertionError(f"unexpected run_args_capture: {args}")

        agent.run_capture = fake_run_capture
        agent.run_args_capture = fake_run_args_capture
        return commands

    def test_first_github_500_then_success(self):
        commands = self._patch_git([
            cp(["git", "push", "origin", "main"], 1, stderr="remote: Internal Server Error\nerror: failed to push some refs"),
            cp(["git", "push", "origin", "main"], 0),
        ])

        sha = agent.push_current_commit_with_retry("run-1", 2, cwd="/tmp/work", sleep_fn=lambda _seconds: None)

        self.assertEqual(sha, "abc123commit")
        self.assertEqual(commands.count(["git", "push", "origin", "main"]), 2)
        self.assertIn(["git", "fetch", "origin", "main"], commands)
        self.assertIn(["git", "rebase", "--autostash", "origin/main"], commands)
        self.assertFalse(any("--force" in part or "--force-with-lease" in part for cmd in commands for part in cmd))

    def test_eight_github_500_failures_keep_commit_recoverable(self):
        commands = self._patch_git([
            cp(["git", "push", "origin", "main"], 1, stderr="remote: Internal Server Error\nerror: failed to push some refs")
            for _ in range(8)
        ])

        with self.assertRaisesRegex(RuntimeError, "git push origin main failed after 8 attempts") as ctx:
            agent.push_current_commit_with_retry("run-500", 3, cwd="/tmp/work", sleep_fn=lambda _seconds: None)

        message = str(ctx.exception)
        self.assertIn("run_id=run-500", message)
        self.assertIn("round_no=3", message)
        self.assertIn("commit_sha=abc123commit", message)
        self.assertIn("git fetch origin main", message)
        self.assertIn("git rebase --autostash origin/main", message)
        self.assertIn("git push origin main", message)
        self.assertEqual(commands.count(["git", "push", "origin", "main"]), 8)
        self.assertFalse(any("--force" in part or "--force-with-lease" in part for cmd in commands for part in cmd))

    def test_rebase_conflict_fails_immediately_without_force_push(self):
        commands = self._patch_git(
            [cp(["git", "push", "origin", "main"], 1, stderr="HTTP 500\nerror: failed to push some refs")],
            rebase_result=cp(["git", "rebase", "--autostash", "origin/main"], 1, stderr="CONFLICT (content): merge conflict"),
        )

        with self.assertRaisesRegex(RuntimeError, "no force push was attempted"):
            agent.push_current_commit_with_retry("run-conflict", 4, cwd="/tmp/work", sleep_fn=lambda _seconds: None)

        self.assertEqual(commands.count(["git", "push", "origin", "main"]), 1)
        self.assertIn(["git", "diff", "--name-only", "--diff-filter=U"], commands)
        self.assertFalse(any("--force" in part or "--force-with-lease" in part for cmd in commands for part in cmd))

    def test_rebase_add_add_duplicate_remote_content_returns_remote_sha(self):
        commands = self._patch_git(
            [],
            rebase_result=cp(["git", "rebase", "--autostash", "origin/main"], 1, stderr="CONFLICT (add/add): Merge conflict"),
        )

        def fake_git_blob_at(ref, path, cwd=None):
            self.assertEqual(path, "content/seo-ready/example.md")
            if ref in {"abc123commit", "origin/main"}:
                return b"same article markdown"
            return None

        def fake_abort_rebase(cwd=None):
            commands.append(["git", "rebase", "--abort"])

        agent.git_blob_at = fake_git_blob_at
        agent.abort_rebase = fake_abort_rebase

        sha = agent.rebase_or_fail(
            "run-dupe",
            5,
            cwd="/tmp/work",
            local_commit_sha="abc123commit",
            committed_paths=["content/seo-ready/example.md"],
        )

        self.assertEqual(sha, "remote123commit")
        self.assertIn(["git", "rebase", "--abort"], commands)
        self.assertFalse(any("--force" in part or "--force-with-lease" in part for cmd in commands for part in cmd))


if __name__ == "__main__":
    unittest.main()
