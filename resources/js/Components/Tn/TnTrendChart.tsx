import React, { useEffect, useRef } from 'react';

interface Props {
    data: any[];
}

export default function TnTrendChart({ data }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.length === 0) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        
        // Find min/max for Y axis
        const maxTemp = Math.max(
            ...data.filter(d => d.pv < 10000).map(d => d.pv), // Filter out errors like 30000
            ...data.map(d => d.sv),
            200 // Minimum max scale
        );
        
        const minTemp = 0; // Always start from 0 for temperature

        // Draw Grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const y = padding + (height - 2 * padding) * (i / 4);
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            
            // Y axis labels
            ctx.fillStyle = '#9ca3af';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            const val = maxTemp - ((maxTemp - minTemp) * (i / 4));
            ctx.fillText(Math.round(val).toString(), padding - 5, y + 3);
        }
        ctx.stroke();

        // Draw Lines function
        const drawLine = (key: 'pv' | 'sv' | 'heating_mv', color: string, isMv: boolean = false) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            for (let i = 0; i < data.length; i++) {
                const point = data[i];
                let val = point[key];
                
                // Skip error values for PV
                if (key === 'pv' && (val >= 10000 || val <= -10000)) continue;
                
                if (isMv) {
                    val = (val / 1000) * maxTemp; // Scale MV (0-1000) to fit chart maxTemp
                }

                const x = padding + ((width - 2 * padding) / Math.max(1, data.length - 1)) * i;
                const y = height - padding - ((val - minTemp) / (maxTemp - minTemp)) * (height - 2 * padding);
                
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        // Draw Data
        drawLine('sv', '#10b981'); // SV Green
        drawLine('pv', '#3b82f6'); // PV Blue

        // Draw Legend
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(width - padding - 150, 10, 10, 10);
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'left';
        ctx.fillText('PV (℃)', width - padding - 135, 19);

        ctx.fillStyle = '#10b981';
        ctx.fillRect(width - padding - 80, 10, 10, 10);
        ctx.fillStyle = '#4b5563';
        ctx.fillText('SV (℃)', width - padding - 65, 19);

    }, [data]);

    return (
        <div className="w-full h-full">
            <canvas 
                ref={canvasRef} 
                width={800} 
                height={300} 
                className="w-full h-full object-contain"
            />
        </div>
    );
}
