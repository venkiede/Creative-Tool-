from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .schemas import *
from .utils import save_upload, UPLOAD_DIR, EXPORT_DIR
from .ai import remove_background_rembg, suggest_layouts
from .compliance import validate_layout
import shutil
import os
import uuid

app = FastAPI(title="CreativeOS Middleware")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

# Static
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/exports", StaticFiles(directory=str(EXPORT_DIR)), name="exports")

@app.get("/")
async def root():
    return {"message": "CreativeOS Backend is running"}

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
    
    # Force PNG for transparency support
    base_name = os.path.splitext(packshot_id)[0]
    output_filename = f"nobg_{base_name}.png"
    output_path = UPLOAD_DIR / output_filename
    
    success = remove_background_rembg(str(input_path), str(output_path))
    if success:
        return {"url": f"/uploads/{output_filename}"}
    else:
        return {"url": f"/uploads/{packshot_id}", "details": "Background removal failed, returned original"}

@app.post("/suggest-layouts", response_model=List[LayoutProposal])
async def get_layouts(req: LayoutRequest):
    return suggest_layouts(req.packshot_id, req.width, req.height)

class ValidationRequest(BaseModel):
    width: int
    height: int
    elements: List[LayoutElement]

@app.post("/validate", response_model=ValidationReport)
async def validate(req: ValidationRequest):
    # Adapter to match existing compliance functions
    layout_req = LayoutRequest(packshot_id="check", width=req.width, height=req.height)
    return validate_layout(layout_req, req.elements)

@app.post("/auto-fix", response_model=List[LayoutElement])
async def auto_fix(req: ValidationRequest):
    from .compliance import auto_fix_elements
    return auto_fix_elements(req.elements, req.width, req.height)

@app.post("/export", response_model=ExportResponse)
async def export_layout(req: ExportRequest):
    from PIL import Image, ImageDraw, ImageFont, ImageColor
    
    # Create canvas with background color
    bg_color = req.background_color or "#ffffff"
    try:
        img = Image.new("RGB", (req.canvas_width, req.canvas_height), ImageColor.getrgb(bg_color))
    except:
        img = Image.new("RGB", (req.canvas_width, req.canvas_height), "white")
        
    draw = ImageDraw.Draw(img)
    
    # Sort elements by z_index
    sorted_elements = sorted(req.elements, key=lambda e: e.z_index or 0)
    
    for el in sorted_elements:
        if el.type == "text" and el.text:
            text_color = el.color or "#000000"
            font_size = el.font_size or 24
            
            # Simple fallback font logic
            try:
                # Try to load a standard font. On Windows 'arial.ttf', Linux 'DejaVuSans.ttf' often exists
                # For this environment, we try a few common ones
                font_path = "arial.ttf" 
                font = ImageFont.truetype(font_path, size=int(font_size))
            except IOError:
                # If fail, use default (size is fixed in default, sadly)
                font = ImageFont.load_default()
            
            draw.text((el.x, el.y), el.text, fill=text_color, font=font)
            
        elif el.type == "packshot" or el.type == "image" or el.type == "logo":
             if el.text and "/uploads/" in el.text:
                 fname = el.text.split("/uploads/")[-1]
                 fpath = UPLOAD_DIR / fname
                 if fpath.exists():
                     try:
                         p_img = Image.open(fpath).convert("RGBA")
                         # Resize
                         if el.width and el.height:
                             p_img = p_img.resize((int(el.width), int(el.height)), Image.Resampling.LANCZOS)
                         
                         # Paste with alpha
                         img.paste(p_img, (int(el.x), int(el.y)), p_img)
                     except Exception as e:
                         print(f"Error rendering image {fname}: {e}")
             else:
                 # Draw placeholder
                 draw.rectangle([el.x, el.y, el.x+(el.width or 100), el.y+(el.height or 100)], outline="gray", width=2)

    filename = f"export_{req.canvas_width}x{req.canvas_height}_{uuid.uuid4().hex[:6]}.jpg"
    out_path = EXPORT_DIR / filename
    
    img.save(out_path, format="JPEG", quality=95)
    size = os.path.getsize(out_path)
        
    return ExportResponse(url=f"/exports/{filename}", size_kb=size/1024)
