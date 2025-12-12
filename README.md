# CreativeOS

AI Retail Media Creative Builder prototype.

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+

### 1. Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs at `http://localhost:3000`.

### 3. Testing
`pytest tests/`

## Features & Compliance
- **Upload**: Supports basic image formats.
- **Rembg**: Removes backgrounds (requires `rembg` installed).
- **Layouts**: Suggests 3 formats.
- **Validation**: Checks dimensions, basic safe zones (9:16), and forbidden copy (e.g. "discount").
- **Export**: Compresses to <500KB.

## Assumptions
- Canvas default 1200x1200px.
- Fonts: System default sans-serif.
- 9:16 Safe Zones: Top 200px, Bottom 250px.
