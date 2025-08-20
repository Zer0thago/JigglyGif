import { readfile } from "./fileUtils.js";
import { extractGlobalColorTable, pixelIndicesToRGBA, saveRGBAData } from "./colorUtils.js";
import { findNextImageDescriptor } from "./headerUtils.js";
import LZWDecoder from "./lzwdecoder.js";
import fsSync from "fs";

function extractSingleFrame(buffer, imageOffset, globalColorTable, frameIndex, graphicControl) {
    try {
        const left = buffer.readUInt16LE(imageOffset + 1);
        const top = buffer.readUInt16LE(imageOffset + 3);
        const width = buffer.readUInt16LE(imageOffset + 5);
        const height = buffer.readUInt16LE(imageOffset + 7);
        const imageDescriptorPacked = buffer[imageOffset + 9];

        console.log(`Frame ${frameIndex + 1}: ${width}x${height} at (${left}, ${top})`);

        const localColorTableFlag = (imageDescriptorPacked & 0x80) !== 0;
        const localColorTableSize = localColorTableFlag ? 3 * (2 << (imageDescriptorPacked & 0x07)) : 0;
        
        const lzwMinCodeSizeOffset = imageOffset + 10 + localColorTableSize;
        let lzwMinCodeSize = buffer[lzwMinCodeSizeOffset];
        
        if (lzwMinCodeSize < 2 || lzwMinCodeSize > 8) {
            lzwMinCodeSize = 8;
        }

        let pos = lzwMinCodeSizeOffset + 1;
        const compressedData = [];
        
        while (pos < buffer.length) {
            const blockSize = buffer[pos];
            if (blockSize === 0) {
                pos++; 
                break;
            }
            pos++;
            for (let i = 0; i < blockSize; i++) {
                compressedData.push(buffer[pos + i]);
            }
            pos += blockSize;
        }

        const decoder = new LZWDecoder(lzwMinCodeSize, compressedData);
        const decompressedPixels = decoder.decompress();

        const colorTable = localColorTableFlag ? 
            extractGlobalColorTable(buffer, imageOffset + 10, localColorTableSize) : 
            globalColorTable;

        const transparentIndex = graphicControl?.transparentColorFlag ? graphicControl.transparentColorIndex : -1;

        const frameRGBA = pixelIndicesToRGBA(decompressedPixels, colorTable, width, height, transparentIndex);

        return {
            frameRGBA,
            left,
            top,
            width,
            height,
            disposalMethod: graphicControl ? graphicControl.disposalMethod : 0,
            nextOffset: pos
        };
        
    } catch (error) {
        console.error(`Error processing frame ${frameIndex + 1}:`, error);
        return null;
    }
}

function extractAllFrames(gifbytes) {
    const buffer = Buffer.from(gifbytes);
    
    const canvasWidth = buffer.readUInt16LE(6);
    const canvasHeight = buffer.readUInt16LE(8);
    console.log(`GIF canvas size: ${canvasWidth}x${canvasHeight}`);
    
    const packed = buffer[10];  
    const globalColorTableFlag = (packed & 0x80) !== 0;  
    const headerLength = 13; 
    const globalColorTableSize = globalColorTableFlag ? 3 * (2 << (packed & 0x07)) : 0;
    const globalColorTableEnd = headerLength + globalColorTableSize;

    const globalColorTable = extractGlobalColorTable(buffer, headerLength, globalColorTableSize);
    console.log(`DEBUG: Extracted ${globalColorTable.length} colors from palette`);

    const folderName = 'gif_frames';
    if (!fsSync.existsSync(folderName)) {
        fsSync.mkdirSync(folderName);
    }

    const canvas = new Uint8Array(canvasWidth * canvasHeight * 4);
    canvas.fill(0); 

    let frameCount = 0;
    let currentOffset = globalColorTableEnd;

    while (currentOffset < buffer.length) {
        const result = findNextImageDescriptor(buffer, currentOffset);
        
        if (!result) {
            break; 
        }

        console.log(`\nProcessing frame ${frameCount + 1} at offset: ${result.imageOffset}`);
        
        const frameData = extractSingleFrame(buffer, result.imageOffset, globalColorTable, frameCount, result.graphicControl);
        
        if (frameData) {
            compositeFrame(
                canvas,
                frameData.frameRGBA,
                frameData.left,
                frameData.top,
                frameData.width,
                frameData.height,
                canvasWidth,
                canvasHeight,
                frameData.disposalMethod,
                frameCount === 0
            );

            const filename = `gif_frames/frame_${frameCount.toString().padStart(3, '0')}`;
            saveRGBAData(canvas, canvasWidth, canvasHeight, filename);

            frameCount++;
            currentOffset = frameData.nextOffset;
        } else {
            break;
        }
    }

    console.log(`\nExtracted ${frameCount} frames total!`);
}

function compositeFrame(canvas, frameRGBA, left, top, frameWidth, frameHeight, canvasWidth, canvasHeight, disposalMethod, isFirstFrame) {
    if (isFirstFrame) {
        canvas.fill(0);
    }
    
    for (let y = 0; y < frameHeight; y++) {
        for (let x = 0; x < frameWidth; x++) {
            const frameIndex = (y * frameWidth + x) * 4;
            const canvasX = left + x;
            const canvasY = top + y;
            
            if (canvasX >= canvasWidth || canvasY >= canvasHeight) continue;
            
            const canvasIndex = (canvasY * canvasWidth + canvasX) * 4;
            
            if (frameRGBA[frameIndex + 3] > 0) {
                canvas[canvasIndex] = frameRGBA[frameIndex];         // R
                canvas[canvasIndex + 1] = frameRGBA[frameIndex + 1]; // G
                canvas[canvasIndex + 2] = frameRGBA[frameIndex + 2]; // B
                canvas[canvasIndex + 3] = frameRGBA[frameIndex + 3]; // A
            }
        }
    }
}

export {
    extractAllFrames,
    compositeFrame,
    extractSingleFrame
}