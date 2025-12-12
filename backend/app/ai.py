import random
from typing import List
from .schemas import LayoutProposal, LayoutElement

def remove_background_rembg(image_path: str, output_path: str):
    try:
        from rembg import remove
        from PIL import Image
        
        inp = Image.open(image_path)
        out = remove(inp)
        out.save(output_path)
        return True
    except Exception as e:
        print(f"Rembg failed: {e}")
        # Fallback: Just copy file if fail, or do simple threshold if critical. 
        # For prototype, if rembg missing/fails, we might just return the original or a mock.
        return False

def suggest_layouts(packshot_id: str, width: int, height: int, canvas_w: int = 1200, canvas_h: int = 1200) -> List[LayoutProposal]:
    """
    Deterministic heuristics for layout generation.
    Returns 3 layouts: 
    1. Left Image / Right Text
    2. Centered Image / Top Text
    3. Grid / Split
    """
    proposals = []
    
    # Defaults
    margin = 50
    text_color = "#000000"
    
    # Layout 1: Packshot Left, Text Right
    l1 = LayoutProposal(
        id="layout_1",
        name="Packshot Left",
        canvas_width=canvas_w,
        canvas_height=canvas_h,
        elements=[
            LayoutElement(type="image", x=margin, y=margin, width=500, height=500, text=packshot_id, z_index=1),
            LayoutElement(type="text", x=600, y=margin, text="Headline Goes Here", font_size=60, font_family="Arial", color=text_color, z_index=2), # Headline
            LayoutElement(type="text", x=600, y=150, text="Subhead details", font_size=36, font_family="Arial", color=text_color, z_index=2), # Subhead
            LayoutElement(type="packshot", x=margin, y=margin, width=500, height=500, text=packshot_id, z_index=1) # The actual packshot reference
        ]
    )
    # Fixup: I used "image" type for packshot in first element, but schema has "packshot". 
    # Also I duplicated it. Let's fix the element list.
    
    l1.elements = [
         LayoutElement(type="packshot", x=100, y=300, width=500, height=500, text=packshot_id, z_index=1),
         LayoutElement(type="text", x=650, y=400, text="Big Headline", font_size=80, font_family="Arial", color=text_color, z_index=2),
         LayoutElement(type="text", x=650, y=520, text="Subheading", font_size=40, font_family="Arial", color=text_color, z_index=2),
         # Example Value Tile placeholder
         LayoutElement(type="text", x=900, y=100, text="", width=200, height=200, tile_type="New", z_index=3) 
    ]
    proposals.append(l1)

    # Layout 2: Centered
    l2 = LayoutProposal(
        id="layout_2",
        name="Centered Focus",
        canvas_width=canvas_w,
        canvas_height=canvas_h,
        elements=[
            LayoutElement(type="text", x=300, y=100, text="Main Headline", font_size=80, font_family="Arial", color=text_color, z_index=2),
            LayoutElement(type="packshot", x=350, y=300, width=500, height=500, text=packshot_id, z_index=1),
             LayoutElement(type="text", x=100, y=900, text="Only at Tesco", font_size=30, font_family="Arial", color="#00539F", z_index=2) # Tag
        ]
    )
    proposals.append(l2)
    
    # Layout 3: Split (Side by Side full height-ish)
    l3 = LayoutProposal(
        id="layout_3",
        name="Split View",
        canvas_width=canvas_w,
        canvas_height=canvas_h,
        elements=[
            LayoutElement(type="shape", x=0, y=0, width=600, height=1200, color="#f0f0f0", z_index=0),
            LayoutElement(type="packshot", x=50, y=350, width=500, height=500, text=packshot_id, z_index=1),
            LayoutElement(type="text", x=650, y=300, text="Feature Text", font_size=70, font_family="Arial", color=text_color, z_index=2),
        ]
    )
    proposals.append(l3)

    return proposals
