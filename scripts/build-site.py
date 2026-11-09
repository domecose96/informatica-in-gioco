#!/usr/bin/env python3
"""Prepara dist/ con la home e i due giochi; esclude test e strumenti locali."""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "dist"
GAMES = ("archivio-ombra", "programma-il-robot")

def build():
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for name in ("index.html", "giochi.css"):
        shutil.copy2(ROOT / name, OUTPUT / name)
    for name in GAMES:
        source, target = ROOT / name, OUTPUT / name
        target.mkdir()
        for file in source.iterdir():
            if file.is_file() and file.suffix in (".html", ".css", ".js"):
                shutil.copy2(file, target / file.name)
        for folder in ("assets", "vendor"):
            if (source / folder).is_dir():
                shutil.copytree(source / folder, target / folder,
                                ignore=shutil.ignore_patterns(".DS_Store", "__pycache__"))
    (OUTPUT / ".nojekyll").touch()
    # Preserve shared/bookmarked old URLs, including exercise IDs and anchors.
    redirects = {
        "archivio-ombra.html": "archivio-ombra/index.html",
        "programma-il-robot.html": "programma-il-robot/index.html",
        "robot-livello.html": "programma-il-robot/robot-livello.html",
    }
    for name, destination in redirects.items():
        (OUTPUT / name).write_text(f'''<!doctype html>
<html lang="it"><meta charset="utf-8"><title>Informatica in gioco</title>
<script>location.replace("{destination}" + location.search + location.hash);</script>
<p><a href="{destination}">Apri il gioco</a></p></html>
''')
    return OUTPUT

if __name__ == "__main__":
    print(build())
