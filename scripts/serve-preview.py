#!/usr/bin/env python3
"""Serve the static preview without browser caching during development."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    static_dir = Path(__file__).resolve().parents[1] / "dist"
    handler = lambda *args, **kwargs: NoCacheHandler(
        *args, directory=str(static_dir), **kwargs
    )
    ThreadingHTTPServer(("", 8081), handler).serve_forever()
