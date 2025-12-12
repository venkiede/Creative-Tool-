import os
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
EXPORT_DIR = BASE_DIR / "exports"

def get_unique_filename(filename: str) -> str:
    ext = filename.split(".")[-1]
    return f"{uuid.uuid4()}.{ext}"

def save_upload(file_contents: bytes, filename: str) -> str:
    unique_name = get_unique_filename(filename)
    path = UPLOAD_DIR / unique_name
    with open(path, "wb") as f:
        f.write(file_contents)
    return str(unique_name) # Return filename (served statically)
