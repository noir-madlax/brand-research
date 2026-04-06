import subprocess, sys

result = subprocess.run(
    ["git", "fetch", "origin", "main"],
    cwd="/vercel/share/v0-project",
    capture_output=True, text=True
)
print(result.stdout, result.stderr)

result2 = subprocess.run(
    ["git", "merge", "origin/main", "--no-edit"],
    cwd="/vercel/share/v0-project",
    capture_output=True, text=True
)
print(result2.stdout, result2.stderr)
if result2.returncode != 0:
    sys.exit(result2.returncode)
