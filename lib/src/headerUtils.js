
function checksigniature(buffer) {
    const sig = buffer.slice(0, 6).toString('ascii');
    return sig === "GIF87a" || sig === "GIF89a";
}

function parseGraphicControlExtension(buffer, offset) {
    if (buffer[offset] === 0x21 && buffer[offset + 1] === 0xF9) {
        const blockSize = buffer[offset + 2]; // <- 4
        const packed = buffer[offset + 3]; 
        const delayTime = buffer.readUInt16LE(offset + 4);
        const transparentColorIndex = buffer[offset + 6];
        const blockTerminator = buffer[offset + 7]; // <- 0

        return {
            disposalMethod: (packed >> 2) & 0x07,
            userInputFlag: (packed & 0x02) !== 0,
            transparentColorFlag: (packed & 0x01) !== 0,
            delayTime: delayTime * 10, // Convert to milliseconds
            transparentColorIndex: transparentColorIndex,
            nextOffset: offset + 8
        };
    }
    return null;
}

function findNextImageDescriptor(buffer, startOffset) {
    let pos = startOffset;
    let graphicControl = null;
    
    while (pos < buffer.length) {
        const byte = buffer[pos];
        
        if (byte === 0x2C) {
            return { imageOffset: pos, graphicControl };
        } else if (byte === 0x21) {
            const label = buffer[pos + 1];
            
            if (label === 0xF9) {
                graphicControl = parseGraphicControlExtension(buffer, pos);
                pos = graphicControl.nextOffset;
            } else {
                pos += 2; 
                
                while (pos < buffer.length) {
                    const blockSize = buffer[pos++];
                    if (blockSize === 0) break;
                    pos += blockSize;
                }
            }
        } else {
            pos++;
        }
    }
    
    return null;
}


export {
    checksigniature,
    findNextImageDescriptor,
    parseGraphicControlExtension
}