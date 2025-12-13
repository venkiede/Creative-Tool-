import React, { useState } from 'react';
import CanvasEditor from './components/CanvasEditor';
import { uploadPackshot, suggestLayouts, validateLayout, exportLayout, removeBg } from './api';

function App() {
    const [elements, setElements] = useState([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1200 });
    const [selectedId, setSelectedId] = useState(null);
    const [packshotUrl, setPackshotUrl] = useState(null);
    const [packshotId, setPackshotId] = useState(null);
    const [generatedLayouts, setGeneratedLayouts] = useState([]);
    const [validationReport, setValidationReport] = useState(null);
    const [exportUrl, setExportUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const data = await uploadPackshot(file);
                setPackshotUrl(data.url);
                setPackshotId(data.id);
                setElements([
                    {
                        id: 'packshot-' + Date.now(),
                        type: 'packshot',
                        x: (canvasSize.width - 500) / 2,
                        y: (canvasSize.height - 500) / 2,
                        width: 500,
                        height: 500,
                        text: data.url,
                        z_index: 10
                    }
                ]);
            } catch (error) {
                console.error("Upload failed", error);
                alert("Failed to upload image. Please check if the backend server is running.");
            }
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const data = await uploadPackshot(file); // Reuse existing endpoint
                // Add as Logo Element (High Z-Index)
                setElements(prev => [
                    ...prev,
                    {
                        id: 'logo-' + Date.now(),
                        type: 'logo', // Distinct type
                        x: canvasSize.width - 250, // Top Right default
                        y: 80, // Moved down as requested
                        width: 200, // Smaller default
                        height: 200,
                        text: data.url,
                        z_index: 100 // Always on top
                    }
                ]);
            } catch (error) {
                console.error("Logo Upload failed", error);
            }
        }
    };

    const handleRemoveBg = async () => {
        if (packshotId) {
            setIsProcessing(true);
            try {
                const data = await removeBg(packshotId);

                // Check if the backend returned the same URL (meaning failure fallback)
                if (data.url.includes(packshotId) && !data.url.includes('nobg_')) {
                    alert(`Background removal failed: ${data.details || "Unknown error"}`);
                    console.warn("Backend returned original image: ", data);
                } else {
                    setPackshotUrl(data.url); // Update with BG removed
                    // Also update the element on the canvas
                    setElements(prevElements => prevElements.map(el => {
                        if (el.type === 'packshot') {
                            return { ...el, text: data.url };
                        }
                        return el;
                    }));
                }
            } catch (error) {
                console.error("BG Removal failed", error);
                alert("Background removal failed. Ensure backend is running.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleGetLayouts = async () => {
        if (packshotId) {
            const layouts = await suggestLayouts(packshotId, canvasSize.width, canvasSize.height);
            setGeneratedLayouts(layouts);
        }
    };

    const applyLayout = (layout) => {
        setCanvasSize({ width: layout.canvas_width, height: layout.canvas_height });
        // Identify packshots and fix URLs if they are just IDs
        const fixedElements = layout.elements.map(el => {
            const baseEl = { ...el, id: el.id || 'el-' + Math.random().toString(36).substr(2, 9) };

            if (baseEl.type === 'packshot') {
                // IMPORTANT: Use the current packshotUrl if available, otherwise keep what was there
                return { ...baseEl, text: packshotUrl || baseEl.text };
            }
            return baseEl;
        });

        // Preserve existing manually added logos
        const existingLogos = elements.filter(el => el.type === 'logo');

        setElements([...fixedElements, ...existingLogos]);
    };

    const handleValidate = async () => {
        const report = await validateLayout(canvasSize.width, canvasSize.height, elements);
        setValidationReport(report);
    };

    const handleExport = async () => {
        const res = await exportLayout(canvasSize.width, canvasSize.height, elements, backgroundColor);
        setExportUrl(res.url);
    };

    const updateElement = (key, value) => {
        if (selectedId) {
            setElements(prev => prev.map(el => {
                if (el.id === selectedId) {
                    return { ...el, [key]: value };
                }
                return el;
            }));
        }
    };

    const selectedElement = selectedId ? elements.find(el => el.id === selectedId) : null;

    // State for Features
    const [backgroundColor, setBackgroundColor] = useState("#ffffff");
    const [savedColors, setSavedColors] = useState(() => {
        const saved = localStorage.getItem("brandColors");
        return saved ? JSON.parse(saved) : ["#E60000", "#00539F", "#FFC220"]; // Default Tesco-ish colors
    });

    const saveColor = (color) => {
        if (!savedColors.includes(color)) {
            const newColors = [...savedColors, color].slice(-10); // Keep max 10
            setSavedColors(newColors);
            localStorage.setItem("brandColors", JSON.stringify(newColors));
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>CreativeOS - Retail Media Builder</h1>
                <div>
                    <button onClick={handleValidate} className="secondary" style={{ width: 'auto', marginRight: 10 }}>Validate</button>
                    <button onClick={handleExport} style={{ width: 'auto' }}>Export</button>
                </div>
            </header>

            <div className="main-content">
                {/* Left Panel */}
                <div className="left-panel">
                    <div className="panel-section">
                        <h3>1. Assets</h3>
                        <input type="file" onChange={handleUpload} />
                        {packshotUrl && (
                            <div>
                                <img src={`http://localhost:8000${packshotUrl}`} alt="preview" style={{ width: '100%', marginBottom: 5 }} />
                                <button onClick={handleRemoveBg} className="secondary" disabled={isProcessing}>
                                    {isProcessing ? "Processing..." : "Remove BG"}
                                </button>
                            </div>
                        )}

                        <div style={{ marginTop: 20 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Brand Logo</label>
                            <input type="file" onChange={handleLogoUpload} accept="image/*" />
                        </div>
                    </div>

                    {/* NEW: Background Color Section */}
                    <div className="panel-section">
                        <h3>Background</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                style={{ width: 50, height: 50, cursor: 'pointer' }}
                            />
                            <span>{backgroundColor}</span>
                        </div>
                    </div>

                    <div className="panel-section">
                        <h3>2. Layouts</h3>
                        <select onChange={(e) => {
                            const [w, h] = e.target.value.split('x').map(Number);
                            setCanvasSize({ width: w, height: h });
                            setGeneratedLayouts([]);
                            if (packshotId) {
                                suggestLayouts(packshotId, w, h).then(layouts => setGeneratedLayouts(layouts));
                            }
                        }}>
                            <option value="1200x1200">Square (1200x1200)</option>
                            <option value="1080x1920">Story (1080x1920)</option>
                            <option value="1200x628">Landscape (1200x628)</option>
                        </select>
                        <button onClick={handleGetLayouts}>Suggest Layouts</button>

                        {generatedLayouts.map(l => (
                            <div key={l.id} className="layout-thumb" onClick={() => applyLayout(l)}>
                                {l.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Canvas */}
                <div className="canvas-area">
                    <CanvasEditor
                        width={canvasSize.width}
                        height={canvasSize.height}
                        backgroundColor={backgroundColor}
                        elements={elements}
                        selectedId={selectedId}
                        onSelectElement={setSelectedId}
                        onUpdateElement={(id, newAttrs) => {
                            setElements(prev => prev.map(el => {
                                if (el.id === id) {
                                    return { ...el, ...newAttrs };
                                }
                                return el;
                            }));
                        }}
                    />
                </div>

                {/* Right Panel */}
                <div className="right-panel">
                    <h3>Properties</h3>
                    {selectedElement ? (
                        <div>
                            <label>Text</label>
                            <textarea
                                value={selectedElement.text || ''}
                                onChange={(e) => updateElement('text', e.target.value)}
                                rows={4}
                                style={{ width: '100%', marginBottom: 10, fontFamily: 'inherit' }}
                            />

                            <label>Font Size</label>
                            <input type="number" value={selectedElement.fontSize || selectedElement.font_size || 24} onChange={(e) => updateElement('fontSize', parseInt(e.target.value))} />

                            <label>Color</label>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                                <input
                                    type="color"
                                    value={selectedElement.color || '#000000'}
                                    onChange={(e) => updateElement('color', e.target.value)}
                                    style={{ width: '50px', height: '50px', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                />
                                <button
                                    onClick={() => saveColor(selectedElement.color)}
                                    className="secondary"
                                    style={{ marginLeft: 10, padding: '5px 10px', fontSize: '0.8rem' }}
                                >
                                    Save
                                </button>
                            </div>

                            {/* Brand Colors Palette */}
                            <div style={{ marginBottom: 20 }}>
                                <label>Saved Brand Colors</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {savedColors.map((c, i) => (
                                        <div
                                            key={i}
                                            onClick={() => updateElement('color', c)}
                                            style={{
                                                width: 30,
                                                height: 30,
                                                backgroundColor: c,
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                border: '1px solid #ddd'
                                            }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : <p>Select an element to edit</p>}

                    <hr />
                    {validationReport && (
                        <div className="validation-report">
                            <h4>Compliance Report</h4>
                            <p style={{ fontWeight: 'bold', color: validationReport.overall_pass ? 'green' : 'red' }}>
                                Result: {validationReport.overall_pass ? 'PASS' : 'FAIL'}
                            </p>
                            {validationReport.checks && validationReport.checks.map((c, i) => (
                                <div key={i} style={{ marginBottom: 5, fontSize: '0.9rem' }}>
                                    <span className={c.passed ? 'validation-pass' : 'validation-fail'}>
                                        {c.passed ? '✓' : '✗'} {c.check_name}
                                    </span>
                                    {!c.passed && <div style={{ fontSize: '0.8rem', color: '#666' }}>{c.details}</div>}
                                </div>
                            ))}

                            {!validationReport.overall_pass && (
                                <div style={{ marginTop: 10 }}>
                                    <button
                                        onClick={async () => {
                                            const { autoFixLayout } = require('./api');
                                            try {
                                                const fixedElements = await autoFixLayout(canvasSize.width, canvasSize.height, elements);
                                                if (Array.isArray(fixedElements)) {
                                                    setElements(fixedElements);
                                                    // Re-validate immediately
                                                    setTimeout(handleValidate, 500);
                                                } else {
                                                    console.warn("Auto Check returned invalid data:", fixedElements);
                                                    alert("Auto Fix failed to return valid layout.");
                                                }
                                            } catch (e) {
                                                console.error("Auto Fix Failed", e);
                                                alert("Auto Fix Failed");
                                            }
                                        }}
                                        style={{ backgroundColor: '#28a745', color: 'white' }}
                                    >
                                        Magic Auto Fix ✨
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {exportUrl && (
                        <div style={{ marginTop: 20 }}>
                            <h4>Export Ready</h4>
                            <a href={`http://localhost:8000${exportUrl}`} target="_blank" rel="noreferrer">Download File</a>
                            <br />
                            <small>Debug: {exportUrl}</small>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
