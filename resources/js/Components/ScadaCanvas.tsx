import React from 'react';
import { ScadaMapping, SensorData } from '@/types';
import ScadaElement from './ScadaElement';

interface ScadaCanvasProps {
    mappings: ScadaMapping[];
    sensorData?: SensorData;
    backgroundImageUrl?: string;
    className?: string;
}

export default function ScadaCanvas({ mappings, sensorData, backgroundImageUrl, className = '' }: ScadaCanvasProps) {
    // For a real canvas, elements would have x/y coordinates in their mapping.
    // For now we'll layout elements in a simple grid if coordinates aren't available,
    // or use absolute positioning if they are (assuming they will be added later).
    
    return (
        <div className={`relative w-full overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-inner min-h-[500px] ${className}`} data-testid="scada-canvas">
            {backgroundImageUrl && (
                <div 
                    className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-50 dark:opacity-30"
                    style={{ backgroundImage: `url(${backgroundImageUrl})` }}
                />
            )}
            
            <div className="absolute inset-0 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 h-full auto-rows-max">
                    {mappings.map((mapping) => (
                        <div key={mapping.id} className="relative h-24 w-full">
                            {/* We wrap it in a relative div to allow the absolute ScadaElement to fill it, 
                                since we don't have true X/Y coordinates in this version of the schema */}
                            <ScadaElement 
                                mapping={mapping} 
                                sensorData={sensorData} 
                                className="w-full h-full"
                            />
                        </div>
                    ))}
                    {mappings.length === 0 && (
                        <div className="col-span-full flex h-full items-center justify-center text-gray-400 dark:text-gray-500">
                            No SCADA mappings configured.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
