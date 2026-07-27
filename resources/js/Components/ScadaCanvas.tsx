import React, { useId, useState, useRef, useEffect, useCallback } from 'react';
import { ScadaMapping, ScadaCanvas as ScadaCanvasType, SensorData } from '@/types';
import ScadaElement from './ScadaElement';

interface Interaction {
    id: number;
    mode: 'move' | 'resize';
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
}

interface ScadaCanvasProps {
    mappings: ScadaMapping[];
    canvas?: ScadaCanvasType | null;
    sensorData?: SensorData;
    controllerModel?: string;
    className?: string;
    selectedId?: number | null;
    onSelectElement?: (id: number) => void;
    onDeleteElement?: (id: number) => void;
    onUpdateMapping?: (id: number, updates: Partial<ScadaMapping>) => void;
    readonly?: boolean;
}

export default function ScadaCanvas({ mappings, canvas, sensorData, controllerModel, className = '', selectedId, onSelectElement, onDeleteElement, onUpdateMapping, readonly = true }: ScadaCanvasProps) {
    const canvasW = canvas?.width ?? 1200;
    const canvasH = canvas?.height ?? 800;
    const gridPatternId = `scada-grid-${useId().replace(/:/g, '')}`;
    const viewportRef = useRef<HTMLDivElement>(null);
    const interactionRef = useRef<Interaction | null>(null);

    const selectedMapping = mappings.find(m => m.id === selectedId);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        const interaction = interactionRef.current;
        if (!interaction || !onUpdateMapping) return;
        const snap = canvas?.snap_to_grid ? canvas.grid_size || 20 : 1;
        const dx = Math.round((event.clientX - interaction.startClientX) / snap) * snap;
        const dy = Math.round((event.clientY - interaction.startClientY) / snap) * snap;

        if (interaction.mode === 'move') {
            onUpdateMapping(interaction.id, {
                position_x: Math.max(0, interaction.startX + dx),
                position_y: Math.max(0, interaction.startY + dy),
            });
        } else {
            onUpdateMapping(interaction.id, {
                width: Math.max(20, interaction.startWidth + dx),
                height: Math.max(20, interaction.startHeight + dy),
            });
        }
    }, [canvas?.grid_size, canvas?.snap_to_grid, onUpdateMapping]);

    const handleMouseUp = useCallback(() => {
        interactionRef.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleElementMouseDown = useCallback((event: React.MouseEvent, mapping: ScadaMapping, mode: Interaction['mode']) => {
        if (event.button !== 0 || readonly) return;
        event.preventDefault();
        event.stopPropagation();
        onSelectElement?.(mapping.id);
        interactionRef.current = {
            id: mapping.id,
            mode,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: mapping.position_x,
            startY: mapping.position_y,
            startWidth: mapping.width,
            startHeight: mapping.height,
        };
    }, [readonly, onSelectElement]);

    return (
        <div
            ref={viewportRef}
            className={`relative overflow-auto rounded-lg border border-slate-700 bg-slate-950 shadow-inner ${className}`}
            style={{ minHeight: 500 }}
            data-testid="scada-canvas"
            onDrop={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
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
                        controllerModel={controllerModel}
                        selected={selectedId === mapping.id}
                        onSelect={readonly ? undefined : onSelectElement}
                    />
                ))}

                {selectedMapping && !readonly && (
                    <div
                        data-element-id={selectedMapping.id}
                        onMouseDown={(event) => handleElementMouseDown(event, selectedMapping, 'move')}
                        className="absolute cursor-move select-none"
                        style={{ left: selectedMapping.position_x, top: selectedMapping.position_y, width: selectedMapping.width, height: selectedMapping.height, zIndex: selectedMapping.z_index + 1000, transform: selectedMapping.rotation ? `rotate(${selectedMapping.rotation}deg)` : undefined }}
                    >
                        <button
                            type="button"
                            onMouseDown={(event) => { event.stopPropagation(); onDeleteElement?.(selectedMapping.id); }}
                            className="absolute -top-7 right-0 rounded bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow hover:bg-red-500"
                        >
                            Hapus
                        </button>
                        <span
                            onMouseDown={(event) => handleElementMouseDown(event, selectedMapping, 'resize')}
                            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-full border-2 border-slate-950 bg-cyan-400 shadow"
                        />
                    </div>
                )}
            </div>

            {mappings.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none">
                    {readonly ? 'No SCADA elements configured. Click "Edit SCADA" to start.' : 'Drag elements from the palette onto the canvas.'}
                </div>
            )}
        </div>
    );
}
