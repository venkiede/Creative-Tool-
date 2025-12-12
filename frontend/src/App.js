import React, { useState } from 'react';
import CanvasEditor from './components/CanvasEditor';
import { uploadPackshot, suggestLayouts, validateLayout, exportLayout, removeBg } from './api';

function App() {
    const [elements, setElements] = useState([]);
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 1200 });
    const [selectedElementIndex, setSelectedElementIndex] = useState(null);
    const [packshotUrl, setPackshotUrl] = useState(null);
    const [packshotId, setPackshotId] = useState(null);
    const [generatedLayouts, setGeneratedLayouts] = useState([]);
    const [validationReport, setValidationReport] = useState(null);
    const [exportUrl, setExportUrl] = useState(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const data = await uploadPackshot(file);
            setPackshotUrl(data.url);
            setPackshotId(data.id);
        }
    };

    const handleRemoveBg = async () => {
        if (packshotId) {
            const data = await removeBg(packshotId);
            setPackshotUrl(data.url); # Update with BG removed
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
            if (el.type === 'packshot') {
                return { ...el, text: packshotUrl }; // Use current loaded URL
            }
            return el;
        });
        setElements(fixedElements);
    };

    const handleValidate = async () => {
        const report = await validateLayout(canvasSize.width, canvasSize.height, elements);
        setValidationReport(report);
    };

    const handleExport = async () => {
        const res = await exportLayout(canvasSize.width, canvasSize.height, elements);
        setExportUrl(res.url);
    };

    const updateElement = (key, value) => {
        if (selectedElementIndex !== null) {
            const newEls = [...elements];
            newEls[selectedElementIndex] = { ...newEls[selectedElementIndex], [key]: value };
            setElements(newEls);
        }
    };

    const selectedElement = selectedElementIndex !== null ? elements[selectedElementIndex] : null;

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
                                <button onClick={handleRemoveBg} className="secondary">Remove BG</button>
                            </div>
                        )}
                    </div>

                    <div className="panel-section">
                        <h3>2. Layouts</h3>
                        <select onChange={(e) => {
                            const [w, h] = e.target.value.split('x').map(Number);
                            setCanvasSize({ width: w, height: h });
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
                        elements={elements}
                        selectedId={selectedElementIndex}
                        onSelectElement={setSelectedElementIndex}
                    />
                </div>

                {/* Right Panel */}
                <div className="right-panel">
                    <h3>Properties</h3>
                    {selectedElement ? (
                        <div>
                            <label>Text</label>
                            <input type="text" value={selectedElement.text || ''} onChange={(e) => updateElement('text', e.target.value)} />

                            <label>Font Size</label>
                            <input type="number" value={selectedElement.font_size || 16} onChange={(e) => updateElement('font_size', parseInt(e.target.value))} />

                            <label>Color</label>
                            <input type="text" value={selectedElement.color || '#000'} onChange={(e) => updateElement('color', e.target.value)} />
                        </div>
                    ) : <p>Select an element to edit</p>}

                    <hr />
                    {validationReport && (
                        <div className="validation-report">
                            <h4>Compliance Report</h4>
                            <p style={{ fontWeight: 'bold', color: validationReport.overall_pass ? 'green' : 'red' }}>
                                Result: {validationReport.overall_pass ? 'PASS' : 'FAIL'}
                            </p>
                            {validationReport.checks.map((c, i) => (
                                <div key={i} style={{ marginBottom: 5, fontSize: '0.9rem' }}>
                                    <span className={c.passed ? 'validation-pass' : 'validation-fail'}>
                                        {c.passed ? '✓' : '✗'} {c.check_name}
                                    </span>
                                    {!c.passed && <div style={{ fontSize: '0.8rem', color: '#666' }}>{c.details}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {exportUrl && (
                        <div style={{ marginTop: 20 }}>
                            <h4>Export Ready</h4>
                            <a href={`http://localhost:8000${exportUrl}`} target="_blank" rel="noreferrer">Download File</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
