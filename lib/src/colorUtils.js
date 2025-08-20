import { readfile } from "./fileUtils.js";
import fsSync from "fs";

function extractGlobalColorTable(buffer, offset, size) {
    const colors = [];
    for (let i = 0; i < size / 3; i++) {
        const r = buffer[offset + i * 3];
        const g = buffer[offset + i * 3 + 1];  
        const b = buffer[offset + i * 3 + 2];
        colors.push({ r, g, b });
    }
    return colors;
}

function pixelIndicesToRGBA(pixelIndices, colorTable, width, height, transparentIndex = -1) {
    const rgba = new Uint8Array(width * height * 4);
    
    for (let i = 0; i < pixelIndices.length; i++) {
        const colorIndex = pixelIndices[i];
        const rgbaIndex = i * 4;
        
        if (transparentIndex !== -1 && colorIndex === transparentIndex) {
            // Transparent pixel
            rgba[rgbaIndex] = 0;     // R
            rgba[rgbaIndex + 1] = 0; // G  
            rgba[rgbaIndex + 2] = 0; // B
            rgba[rgbaIndex + 3] = 0; // A (transparent)
        } else {
            const color = colorTable[colorIndex] || { r: 0, g: 0, b: 0 };
            rgba[rgbaIndex] = color.r;     // Red
            rgba[rgbaIndex + 1] = color.g; // Green  
            rgba[rgbaIndex + 2] = color.b; // Blue
            rgba[rgbaIndex + 3] = 255;     // Alpha (opaque)
        }
    }
    
    return rgba;
}


function saveRGBAData(rgbaData, width, height, filename) {
    const header = `P6\n${width} ${height}\n255\n`;
    const rgb = new Uint8Array(width * height * 3);
    
    for (let i = 0; i < width * height; i++) {
        rgb[i * 3] = rgbaData[i * 4];         // R
        rgb[i * 3 + 1] = rgbaData[i * 4 + 1]; // G  
        rgb[i * 3 + 2] = rgbaData[i * 4 + 2]; // B
    }
    
    const buffer = Buffer.concat([Buffer.from(header), Buffer.from(rgb)]);
    fsSync.writeFileSync(filename + '.ppm', buffer);
    console.log(`Saved ${filename}.ppm`);
}

export {
    extractGlobalColorTable,
    pixelIndicesToRGBA,
    saveRGBAData
}