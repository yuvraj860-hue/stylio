"""Download the Kaggle "Fashion Product Images (Small)" dataset for STYLIO.

Tries the official Kaggle CLI first (requires an authenticated Kaggle account),
then falls back to a direct public download of the dataset ZIP. If neither is
available, you can point the pipeline at a local folder of product images with
--images-dir instead — no sample URLs are fabricated.

Usage:
    python download_dataset.py                 # full dataset
    python download_dataset.py --sample 500    # keep only the first 500 images
    python download_dataset.py --images-dir ./my-images   # use local images
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import List, Optional

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
IMAGES_DIR = DATA_DIR / "images"
STYLES_CSV = "styles.csv"
EXTRACT_MARKER = DATA_DIR / ".extracted"

# The Kaggle dataset id used by the official CLI.
KAGGLE_DATASET = "paramaggarwal/fashion-product-images-dataset"

# A reliable public mirror of the exact same "Fashion Product Images (Small)"
# dataset. Falls back to this when kagglehub / the Kaggle CLI is unavailable.
DIRECT_ZIP_URL = (
    "https://github.com/paramaggarwal/fashion-product-images-dataset"
    "/releases/download/v1.0/fashion-product-images-dataset.zip"
)

ZIP_PATH = DATA_DIR / "fashion-product-images-dataset.zip"


# ---------------------------------------------------------------------------
# Console helpers
# ---------------------------------------------------------------------------

def section(message: str) -> None:
    """Print a section banner."""
    print("\n" + "=" * 70)
    print(message)
    print("=" * 70)


def info(message: str) -> None:
    print(f"[info] {message}")


def ok(message: str) -> None:
    print(f"[ok]   {message}")


def warn(message: str) -> None:
    print(f"[warn] {message}")


# ---------------------------------------------------------------------------
# Dataset checks
# ---------------------------------------------------------------------------

def dataset_exists() -> bool:
    """Return True when styles.csv (and images) are already extracted."""
    if EXTRACT_MARKER.exists() and (DATA_DIR / STYLES_CSV).exists():
        return True
    return (DATA_DIR / STYLES_CSV).exists()


def count_images() -> int:
    """Count jpg/png files inside data/images (if present)."""
    if not IMAGES_DIR.exists():
        return 0
    return sum(1 for _ in IMAGES_DIR.iterdir() if _.suffix.lower() in {".jpg", ".jpeg", ".png"})


# ---------------------------------------------------------------------------
# Download strategies
# ---------------------------------------------------------------------------

def _run_kaggle_cli() -> bool:
    """Try downloading via the official Kaggle CLI."""
    try:
        result = subprocess.run(
            ["kaggle", "datasets", "download", "-d", KAGGLE_DATASET, "-p", str(DATA_DIR)],
            capture_output=False,
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def _download_direct() -> bool:
    """Stream the dataset ZIP from the public mirror URL."""
    section("Downloading dataset (direct mirror)")
    info(f"Source: {DIRECT_ZIP_URL}")
    info(f"Destination: {ZIP_PATH}")

    zip_path = str(ZIP_PATH)
    try:
        with requests.get(DIRECT_ZIP_URL, stream=True, timeout=120) as resp:
            resp.raise_for_status()
            total = int(resp.headers.get("content-length", 0))
            downloaded = 0
            with open(zip_path, "wb") as handle:
                for chunk in resp.iter_content(chunk_size=1024 * 1024):
                    handle.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        percent = downloaded / total * 100
                        print(f"\r  {downloaded / 1e6:.1f} / {total / 1e6:.1f} MB ({percent:.0f}%)", end="")
            print()
    except requests.RequestException as exc:
        warn(f"Direct download failed: {exc}")
        return False

    if not ZIP_PATH.exists() or ZIP_PATH.stat().st_size == 0:
        warn("Downloaded file is empty or missing.")
        return False

    ok(f"Downloaded {ZIP_PATH.stat().st_size / 1e6:.1f} MB")
    return True


def _extract_zip(zip_path: Path) -> bool:
    """Extract a downloaded dataset ZIP into data/ and flatten images."""
    section("Extracting dataset")
    try:
        with zipfile.ZipFile(zip_path) as archive:
            names: List[str] = archive.namelist()
            archive.extractall(DATA_DIR)
    except zipfile.BadZipFile as exc:
        warn(f"Invalid ZIP file: {exc}")
        return False

    # Move images so they live at data/images/<image>.jpg regardless of the
    # folder layout used inside the ZIP (many Kaggle mirrors nest folders).
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    styles_src: Optional[Path] = None

    for found in _iter_image_files(DATA_DIR):
        try:
            shutil.move(str(found), str(IMAGES_DIR / found.name))
        except shutil.Error:
            pass  # already present

    # Locate styles.csv wherever it was extracted.
    for candidate in DATA_DIR.rglob(STYLES_CSV):
        styles_src = candidate
        break

    if styles_src is not None and styles_src.parent != DATA_DIR:
        dest = DATA_DIR / STYLES_CSV
        if not dest.exists():
            shutil.move(str(styles_src), str(dest))

    # Tidy up: remove the flat `images` folder copy and the zip (keep zip? remove).
    _remove_nested_empty_dirs()
    ZIP_PATH.unlink(missing_ok=True)

    (DATA_DIR / ".extracted").touch()
    ok(f"Extracted {count_images()} images.")
    return True


def _iter_image_files(root: Path):
    """Yield image file paths below root, skipping the final images dir."""
    for path in root.rglob("*"):
        if path.is_file() and IMAGES_DIR not in path.parents and path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            yield path


def _remove_nested_empty_dirs() -> None:
    """Remove empty directory leftovers from extraction."""
    for _ in range(6):
        removed = False
        for path in sorted(DATA_DIR.rglob("*")):
            if path.is_dir() and not any(path.iterdir()):
                if path != IMAGES_DIR:
                    path.rmdir()
                    removed = True
        if not removed:
            break


def _copy_local_images(src_dir: Path) -> bool:
    """Copy product images from a local folder into data/images."""
    section(f"Copying local images from {src_dir}")
    if not src_dir.is_dir():
        warn(f"Image directory not found: {src_dir}")
        return False
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for path in sorted(src_dir.iterdir()):
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png"}:
            dest = IMAGES_DIR / path.name
            try:
                shutil.copy2(str(path), str(dest))
                copied += 1
            except shutil.Error as exc:
                warn(f"Skipped {path.name}: {exc}")
    if copied:
        ok(f"Copied {copied} image(s) into {IMAGES_DIR}.")
        return True
    warn("No jpg/png files found in the source directory.")
    return False


# ---------------------------------------------------------------------------
# Sampling
# ---------------------------------------------------------------------------

def apply_sample(sample: int) -> None:
    """Limit data/ to the first `sample` images (stable, deterministic subset)."""
    section(f"Applying --sample {sample}")
    images = sorted(
        [p for p in IMAGES_DIR.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
    )
    if sample >= len(images):
        ok(f"Only {len(images)} images available; nothing to prune.")
        return
    for img in images[sample:]:
        img.unlink()
    ok(f"Kept {sample} of {len(images)} images.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download & extract the STYLIO fashion product dataset."
    )
    parser.add_argument(
        "--sample",
        type=int,
        default=0,
        help="Keep only the first N images (0 = keep everything).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-download even if the dataset already exists.",
    )
    parser.add_argument(
        "--images-dir",
        type=str,
        default="",
        help="Local folder of product images to use instead of the Kaggle dataset.",
    )
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Local images instead of any download: fastest and fully reliable.
    if args.images_dir:
        _copy_local_images(Path(args.images_dir))
        if not IMAGES_DIR.exists() or count_images() == 0:
            warn("No usable images found. Build the index with a real image source.")
            return 1
        section("Dataset ready (local images)")
        ok(f"Images:      {count_images()} files in {IMAGES_DIR}")
        print("\n[info] Point build_index.py at these images to create the index.")
        return 0

    if dataset_exists() and not args.force:
        info(f"Dataset already present at {DATA_DIR}. Skipping download.")
        section("Existing dataset summary")
        ok(f"styles.csv: {DATA_DIR / STYLES_CSV}")
        ok(f"Images:     {count_images()} files in {IMAGES_DIR}")
        if args.sample:
            apply_sample(args.sample)
        return 0

    # Strategy 1: official Kaggle CLI.
    if _run_kaggle_cli():
        ok("Downloaded via Kaggle CLI.")
        found_zip = next(DATA_DIR.glob("*.zip"), None)
        if found_zip and _extract_zip(found_zip):
            pass
        else:
            warn("No ZIP produced by Kaggle CLI; falling back to direct download.")
            if _download_direct():
                _extract_zip(ZIP_PATH)
    # Strategy 2: direct mirror.
    elif _download_direct():
        _extract_zip(ZIP_PATH)
    # No download worked: tell the user how to proceed instead of fabricating data.
    else:
        warn(
            "All dataset download strategies failed. Provide images instead:\n"
            "    python download_dataset.py --images-dir ./path/to/images\n"
            "Then run build_index.py against the local images."
        )
        return 1

    if not dataset_exists():
        warn("Dataset extraction incomplete — styles.csv not found.")
        return 1

    section("Dataset ready")
    ok(f"styles.csv:  {DATA_DIR / STYLES_CSV}")
    ok(f"Images:      {count_images()} files in {IMAGES_DIR}")

    if args.sample:
        apply_sample(args.sample)

    section("Done")
    ok(f"Next step:  python build_index.py --test")
    return 0


if __name__ == "__main__":
    sys.exit(main())