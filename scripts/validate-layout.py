#!/usr/bin/env python3
"""Verifica collegamenti, risorse e autonomia delle cartelle di gioco."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
GAMES = ("archivio-ombra", "programma-il-robot", "rete-zero")

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
    def handle_starttag(self, tag, attrs):
        self.urls.extend(value for key, value in attrs
                         if key in ("src", "href") and value)

def check_folder(folder, boundary):
    used = set()
    for file in folder.rglob("*"):
        if not file.is_file() or file.suffix not in (".html", ".css", ".js"):
            continue
        if "tests" in file.relative_to(folder).parts:
            continue
        source = file.read_text()
        refs = []
        if file.suffix == ".html":
            parser = References()
            parser.feed(source)
            refs.extend(parser.urls)
        if file.suffix == ".css":
            refs.extend(re.findall(r"url\(['\"]?([^)'\"]+)", source))
        if file.suffix == ".js":
            refs.extend(re.findall(r"['\"](assets/[^'\"]+)['\"]", source))
        for ref in refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path:
                continue
            target = (file.parent / unquote(url.path)).resolve()
            assert target.is_relative_to(boundary), f"Dipendenza esterna: {file}: {ref}"
            assert target.is_file(), f"File mancante: {file}: {ref}"
            used.add(target)
    return used

# A cover can be owned by a game but used only by the shared home.
home_references = References()
home_references.feed((ROOT / 'index.html').read_text())
home_assets = {(ROOT / unquote(urlsplit(ref).path)).resolve()
               for ref in home_references.urls
               if not urlsplit(ref).scheme and urlsplit(ref).path}

for name in GAMES:
    game = ROOT / name
    used = check_folder(game, game)
    used.update(asset for asset in home_assets if asset.is_relative_to(game))
    # Battery images are selected dynamically at runtime.
    if name == "programma-il-robot":
        used.update((game / "assets" / f"robot-batteria-{charge}.webp").resolve()
                    for charge in ("2-tacche", "3-tacche", "4-tacche", "scarica", "ricarica"))
    for asset in (game / "assets").iterdir():
        if asset.name != ".DS_Store":
            assert asset.resolve() in used, f"Risorsa inutilizzata: {asset}"
    with tempfile.TemporaryDirectory(prefix=f"{name}-indipendente-") as tmp:
        copy = Path(tmp) / name
        shutil.copytree(game, copy)
        for test in sorted((copy / "tests").glob("*.cjs")):
            result = subprocess.run(["node", str(test)], cwd=tmp, capture_output=True, text=True)
            assert result.returncode == 0, result.stdout + result.stderr
    print(f"OK: {name} funziona copiato da solo, senza dipendenze dagli altri giochi.")

if (ROOT / "dist").exists():
    check_folder(ROOT / "dist", ROOT / "dist")
    assert not list((ROOT / "dist").rglob("*.cjs"))
    assert not list((ROOT / "dist").rglob("*.py"))
    print("OK: distribuzione web completa, senza test e strumenti locali.")
