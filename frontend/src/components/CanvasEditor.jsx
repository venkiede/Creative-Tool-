import React from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

const URLImage = ({ src, x, y, width, height }) => {
    const [img] = useImage(src ? "http://localhost:8000" + src : "", "anonymous");
    if (!src) return <Rect x={x} y={y} width={width} height={height} fill="gray" />;
    return (
        <KonvaImage
            image={img}
            x={x}
            y={y}
            width={width}
            height={height}
        />
    );
};

const CanvasEditor = ({ width, height, elements, onSelectElement, selectedId }) => {
    // Scaling to fit screen
    const scale = Math.min(600 / width, 600 / height); # Fit in 600x600 preview box

    return (
        <div style={{ width: width * scale, height: height * scale, border: '1px solid #ccc' }}>
            <Stage width={width * scale} height={height * scale} scaleX={scale} scaleY={scale}>
                <Layer>
                    {/* Background */}
                    <Rect x={0} y={0} width={width} height={height} fill="white" />

                    {/* Safe Zones Visualization (Optional) */}
                    {/* If 9:16, show red transparent zones */}
                    {width === 1080 && height === 1920 && (
                        <>
                            <Rect x={0} y={0} width={1080} height={200} fill="rgba(255,0,0,0.1)" listening={false} />
                            <Rect x={0} y={1920 - 250} width={1080} height={250} fill="rgba(255,0,0,0.1)" listening={false} />
                        </>
                    )}

                    {elements.map((el, i) => {
                        const isSelected = i === selectedId;

                        if (el.type === 'packshot' || el.type === 'image') {
                            return (
                                <URLImage
                                    key={i}
                                    src={el.text} // In our schema 'text' property holds URL for Packshots/Images sometimes
                                    x={el.x}
                                    y={el.y}
                                    width={el.width}
                                    height={el.height}
                                />
                            );
                        } else if (el.type === 'text') {
                            return (
                                <Text
                                    key={i}
                                    text={el.text}
                                    x={el.x}
                                    y={el.y}
                                    fontSize={el.font_size}
                                    fontFamily={el.font_family}
                                    fill={el.color}
                                    onClick={() => onSelectElement(i)}
                                    draggable
                                    onDragEnd={(e) => {
                                        // In real app, update state with new X/Y
                                        console.log("Moved to", e.target.x(), e.target.y());
                                    }}
                                />
                            );
                        } else if (el.type === 'shape') {
                            return <Rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} fill={el.color} />;
                        }
                        return null;
                    })}
                </Layer>
            </Stage>
        </div>
    );
};

export default CanvasEditor;
