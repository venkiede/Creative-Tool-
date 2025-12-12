from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .schemas import *
from .utils import save_upload, UPLOAD_DIR, EXPORT_DIR
from .ai import remove_background_rembg, suggest_layouts
from .compliance import validate_layout
import shutil
import os

app = FastAPI(title="CreativeOS Middleware")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/exports", StaticFiles(directory=str(EXPORT_DIR)), name="exports")

@app.post("/upload", response_model=Packshot)
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    filename = save_upload(content, file.filename)
    # In real app, we'd get dimensions from image
    return Packshot(id=filename, url=f"/uploads/{filename}", width=1000, height=1000)

@app.post("/remove-bg")
async def remove_bg(packshot_id: str):
    # Assume packshot_id is filename in uploads
    input_path = UPLOAD_DIR / packshot_id
    if not input_path.exists():
        raise HTTPException(404, "File not found")
    
    output_filename = f"nobg_{packshot_id}"
    output_path = UPLOAD_DIR / output_filename
    
    success = remove_background_rembg(str(input_path), str(output_path))
    if success:
        return {"url": f"/uploads/{output_filename}"}
    else:
        return {"url": f"/uploads/{packshot_id}", "details": "Background removal failed, returned original"}

@app.post("/suggest-layouts", response_model=List[LayoutProposal])
async def get_layouts(req: LayoutRequest):
    return suggest_layouts(req.packshot_id, req.width, req.height)

@app.post("/validate", response_model=ValidationReport)
async def validate(req: LayoutRequest, elements: List[LayoutElement]):
    return validate_layout(req, elements)

@app.post("/export", response_model=ExportResponse)
async def export_layout(req: ExportRequest):
    # Mock export for now - creates a blank image or draws simple rects
    from PIL import Image, ImageDraw, ImageFont
    
    img = Image.new("RGB", (req.canvas_width, req.canvas_height), "white")
    draw = ImageDraw.Draw(img)
    
    for el in req.elements:
        # Simple rendering
        if el.type == "text" and el.text:
             # Try to load font, else default
             draw.text((el.x, el.y), el.text, fill=el.color)
        elif el.type == "packshot":
             # In real app, load image from uploads and paste
             # draw.rectangle([el.x, el.y, el.x+el.width, el.y+el.height], outline="blue")
             pass
    
    filename = f"export_{req.canvas_width}x{req.canvas_height}.jpg"
    out_path = EXPORT_DIR / filename
    
    # Compression Logic Mock
    quality = 95
    img.save(out_path, format="JPEG", quality=quality)
    size = os.path.getsize(out_path)
    
    while size > 500 * 1024 and quality > 10:
        quality -= 10
        img.save(out_path, format="JPEG", quality=quality)
        size = os.path.getsize(out_path)
        
    return ExportResponse(url=f"/exports/{filename}", size_kb=size/1024)
