from __future__ import annotations

from pathlib import Path

from fontTools.merge import Merger


ROOT = Path(__file__).resolve().parent
SOURCE_ROOT = ROOT.parents[1] / "node_modules" / "@fontsource"
OUTPUT_ROOT = ROOT / "fonts"

FONT_BUILDS = {
    "cormorant-garamond-static-400.ttf": [
        SOURCE_ROOT
        / "cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff",
        SOURCE_ROOT
        / "cormorant-garamond/files/cormorant-garamond-latin-ext-400-normal.woff",
        SOURCE_ROOT
        / "cormorant-garamond/files/cormorant-garamond-vietnamese-400-normal.woff",
        SOURCE_ROOT
        / "cormorant-garamond/files/cormorant-garamond-cyrillic-400-normal.woff",
        SOURCE_ROOT
        / "cormorant-garamond/files/cormorant-garamond-cyrillic-ext-400-normal.woff",
    ],
    "instrument-sans-static-400.ttf": [
        SOURCE_ROOT
        / "instrument-sans/files/instrument-sans-latin-400-normal.woff",
        SOURCE_ROOT
        / "instrument-sans/files/instrument-sans-latin-ext-400-normal.woff",
    ],
    "instrument-sans-static-600.ttf": [
        SOURCE_ROOT
        / "instrument-sans/files/instrument-sans-latin-600-normal.woff",
        SOURCE_ROOT
        / "instrument-sans/files/instrument-sans-latin-ext-600-normal.woff",
    ],
}


def build_font(output_name: str, sources: list[Path]) -> None:
    missing = [source for source in sources if not source.is_file()]
    if missing:
        raise FileNotFoundError(missing[0])

    font = Merger().merge([str(source) for source in sources])
    font.flavor = None
    font.save(OUTPUT_ROOT / output_name)


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for output_name, sources in FONT_BUILDS.items():
        build_font(output_name, sources)
        print(output_name)


if __name__ == "__main__":
    main()
