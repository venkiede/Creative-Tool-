import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';

const URLImage = ({ scale, src, x, y, width, height, rotation, onSelect, onChange, isSelected }) => {
    const shapeRef = useRef();
    const trRef = useRef();
    const [img] = useImage(src ? "http://localhost:8000" + src : "", "anonymous");

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <KonvaImage
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                image={img}
                x={x}
                y={y}
                width={width}
                height={height}
                rotation={rotation || 0}
                stroke="#cccccc" // Grey border
                strokeWidth={1}
                draggable
                onDragEnd={(e) => {
                    onChange({
                        x: e.target.x() / scale,
                        y: e.target.y() / scale,
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        x: node.x() / scale,
                        y: node.y() / scale,
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        rotation: node.rotation(),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </>
    );
};

const SimpleText = ({ scale, text, x, y, width, fontSize, font_size, fontFamily, color, rotation, onSelect, onChange, isSelected }) => {
    const activeFontSize = fontSize || font_size || 24;
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Text
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                text={text}
                x={x}
                y={y}
                width={width > 0 ? width : undefined} // Fix: Allow auto-width if 0 provided by backend
                fontSize={activeFontSize}
                fontFamily={fontFamily}
                fill={color}
                rotation={rotation || 0}
                draggable
                onDragEnd={(e) => {
                    onChange({
                        x: e.target.x() / scale,
                        y: e.target.y() / scale,
                    });
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    node.scaleX(1);
                    node.scaleY(1);

                    const newFontSize = Math.max(12, node.fontSize() * scaleY);
                    const newWidth = Math.max(30, node.width() * scaleX);

                    node.fontSize(newFontSize);
                    node.width(newWidth);

                    // FORCE recalculation
                    const newHeight = node.getClientRect().height;

                    onChange({
                        x: node.x() / scale,
                        y: node.y() / scale,
                        width: newWidth,
                        fontSize: newFontSize,
                        height: newHeight,
                        rotation: node.rotation(),
                    });
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        newBox.width = Math.max(30, newBox.width);
                        return newBox;
                    }}
                />
            )}
        </>
    );
};


const CanvasEditor = ({ width, height, elements = [], onSelectElement, selectedId, onUpdateElement, backgroundColor = "#ffffff" }) => {
    const scale = Math.min(600 / width, 600 / height);

    return (
        <div style={{ width: width * scale, height: height * scale, border: '1px solid #ccc' }}>
            <Stage
                width={width * scale}
                height={height * scale}
                scaleX={scale}
                scaleY={scale}
                onMouseDown={(e) => {
                    const clickedOnEmpty = e.target === e.target.getStage();
                    if (clickedOnEmpty) {
                        onSelectElement(null);
                    }
                }}
            >
                <Layer>
                    <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} listening={false} />

                    {width === 1080 && height === 1920 && (
                        <>
                            <Rect x={0} y={0} width={1080} height={200} fill="rgba(255,0,0,0.1)" listening={false} />
                            <Rect x={0} y={1920 - 250} width={1080} height={250} fill="rgba(255,0,0,0.1)" listening={false} />
                        </>
                    )}

                    {Array.isArray(elements) && elements.sort((a, b) => (a.z_index || 0) - (b.z_index || 0)).map((el, i) => {
                        const isSelected = el.id === selectedId;

                        if (el.type === 'packshot' || el.type === 'image' || el.type === 'logo') {
                            return (
                                <URLImage
                                    key={el.id || i}
                                    {...el}
                                    src={el.text} // Fix: Map 'text' field to 'src' expected by URLImage
                                    scale={scale}
                                    isSelected={isSelected}
                                    onSelect={() => onSelectElement(el.id)}
                                    onChange={(newAttrs) => onUpdateElement(el.id, newAttrs)}
                                />
                            );
                        } else if (el.type === 'text') {
                            return (
                                <SimpleText
                                    key={el.id || i}
                                    {...el}
                                    scale={scale}
                                    isSelected={isSelected}
                                    onSelect={() => onSelectElement(el.id)}
                                    onChange={(newAttrs) => onUpdateElement(el.id, newAttrs)}
                                />
                            )
                        }
                        return null;
                    })}
                </Layer>
            </Stage>
        </div>
    );
};

export default CanvasEditor;
