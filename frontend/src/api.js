const API_URL = "http://localhost:8000";

export const uploadPackshot = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
    });
    return res.json();
};

export const removeBg = async (packshotId) => {
    const res = await fetch(`${API_URL}/remove-bg?packshot_id=${packshotId}`, {
        method: "POST",
    });
    return res.json();
};

export const suggestLayouts = async (packshotId, width, height) => {
    const res = await fetch(`${API_URL}/suggest-layouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packshot_id: packshotId, width, height }),
    });
    return res.json();
};

export const validateLayout = async (width, height, elements) => {
    // Validate endpoint expects query params for LayoutRequest (or body if model) + list of elements
    // But FastApi parses body. My main.py signature: validate(req: LayoutRequest, elements: List[LayoutElement])
    // This implies JSON body should be `{ "req": {...}, "elements": [...] }` OR flattened?
    // FastAPI multiple body params expects specific naming.
    // Let's assume simpler single Pydantic model in future refactor, but for now, 
    // I will send correct structure. Actually, to simplify, I should have wrapped them in a parent model.
    // I will cheat: I will edit main.py later if needed, but standard FastAPI with multiple Body params expects dict keys.
    // { "req": { ... }, "elements": [ ... ] }

    const res = await fetch(`${API_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            req: { packshot_id: "layout_check", width, height },
            elements: elements
        }),
    });
    return res.json();
};

export const exportLayout = async (width, height, elements) => {
    const res = await fetch(`${API_URL}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            canvas_width: width,
            canvas_height: height,
            elements: elements
        }),
    });
    return res.json();
};
