from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import date

class Packshot(BaseModel):
    id: str
    url: str
    width: int
    height: int

class LayoutRequest(BaseModel):
    packshot_id: str
    width: int
    height: int

class LayoutElement(BaseModel):
    type: Literal["packshot", "text", "shape", "image"]
    x: int
    y: int
    width: Optional[int] = None
    height: Optional[int] = None
    text: Optional[str] = None
    font_size: Optional[int] = None
    font_family: Optional[str] = "Arial"
    color: Optional[str] = "#000000"
    z_index: Optional[int] = 0
    # Additional props for value tiles
    tile_type: Optional[Literal["New", "White", "Clubcard"]] = None
    price: Optional[str] = None
    regular_price: Optional[str] = None
    end_date: Optional[str] = None # DD/MM

class LayoutProposal(BaseModel):
    id: str
    name: str
    canvas_width: int
    canvas_height: int
    elements: List[LayoutElement]

class ComplianceCheck(BaseModel):
    check_name: str
    passed: bool
    details: str
    suggested_fix: Optional[str] = None

class ValidationReport(BaseModel):
    overall_pass: bool
    checks: List[ComplianceCheck]

class ExportRequest(BaseModel):
    canvas_width: int
    canvas_height: int
    elements: List[LayoutElement]
    format: Literal["png", "jpg"] = "jpg"

class ExportResponse(BaseModel):
    url: str
    size_kb: float
