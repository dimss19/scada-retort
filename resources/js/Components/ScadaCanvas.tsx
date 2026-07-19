import React, { useId } from 'react';
import { ScadaMapping, ScadaCanvas as ScadaCanvasType, SensorData } from '@/types';
import ScadaElement from './ScadaElement';

interface ScadaCanvasProps {
    mappings: ScadaMapping[];
    canvas?: ScadaCanvasType | null;
    sensorData?: SensorData;
    className?: string;
    selectedId?: number | null;
    onSelectElement?: (id: number) => void;
    readonly?: boolean;
}

export default function ScadaCanvas({ mappings, canvas, sensorData, className = '', selectedId, onSelectElement, readonly = true }: ScadaCanvasProps) {
    const canvasW = canvas?.width ?? 1200;
    const canvasH = canvas?.height ?? 800;
    const gridPatternId = `scada-grid-${useId().replace(/:/g, '')}`;

    return (
        <div
            className={`relative overflow-auto rounded-lg border border-slate-700 bg-slate-950 shadow-inner ${className}`}
            style={{ minHeight: 500 }}
            data-testid="scada-canvas"
        >
            <div className="relative bg-[#07111d]" style={{ width: canvasW, height: canvasH, minHeight: 500 }}>
                {canvas?.background_image_url && (
                    <div className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-25"
                        style={{ backgroundImage: `url(${canvas.background_image_url})` }} />
                )}

                {canvas?.grid_enabled && (
                    <svg className="pointer-events-none absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <defs>
                            <pattern id={gridPatternId} width={canvas.grid_size} height={canvas.grid_size} patternUnits="userSpaceOnUse">
                                <path d={`M ${canvas.grid_size} 0 L 0 0 0 ${canvas.grid_size}`} fill="none" stroke="#475569" strokeWidth="0.5" opacity="0.38" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
                    </svg>
                )}

                {mappings.map((mapping) => (
                    <ScadaElement
                        key={mapping.id}
                        mapping={mapping}
                        sensorData={sensorData}
                        selected={selectedId === mapping.id}
                        onSelect={readonly ? undefined : onSelectElement}
                    />
                ))}
            </div>

            {mappings.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none">
                    {readonly ? 'No SCADA elements configured. Click "Edit SCADA" to start.' : 'Drag elements from the palette onto the canvas.'}
                </div>
            )}
        </div>
    );
}
