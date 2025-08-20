
class LZWDecoder {
  constructor(minCodeSize, compressedData) {
    this.data = compressedData;
    this.bytePos = 0;
    this.bitPos = 0;
    this.minCodeSize = minCodeSize;
    this.clearCode = 1 << minCodeSize;
    this.endCode = this.clearCode + 1;
    this.codeSize = minCodeSize + 1;
    this.dict = [];
    this.resetDictionary();
    
    // console.log(`DEBUG: Initialized decoder with minCodeSize=${minCodeSize}, clearCode=${this.clearCode}, endCode=${this.endCode}`);
    // console.log(`DEBUG: Compressed data length: ${compressedData.length}`);
    
    //const firstBits = compressedData[0] & ((1 << (minCodeSize + 1)) - 1);
    // console.log(`DEBUG: First ${minCodeSize + 1} bits should be Clear Code (${this.clearCode}), got: ${firstBits}`);
  }

  resetDictionary() {
    this.dict = [];
    const dictSize = 1 << this.minCodeSize;
    for (let i = 0; i < dictSize; i++) {
      this.dict[i] = [i];
    }
    this.dict[this.clearCode] = null;
    this.dict[this.endCode] = null;
    this.nextCode = this.endCode + 1;
    this.codeSize = this.minCodeSize + 1;
    
    // console.log(`DEBUG: Dictionary reset. Size: ${dictSize}, nextCode: ${this.nextCode}, codeSize: ${this.codeSize}`);
  }

  readCode() {
    let code = 0;
    let bitsRead = 0;

    while (bitsRead < this.codeSize) {
      if (this.bytePos >= this.data.length) {
        // console.log("DEBUG: No more data to read");
        return null;
      }

      const currentByte = this.data[this.bytePos];
      const bitsLeftInByte = 8 - this.bitPos;
      const bitsToRead = Math.min(bitsLeftInByte, this.codeSize - bitsRead);

      const mask = (1 << bitsToRead) - 1;
      const bits = (currentByte >> this.bitPos) & mask;

      code |= bits << bitsRead;

      bitsRead += bitsToRead;
      this.bitPos += bitsToRead;

      if (this.bitPos >= 8) {
        this.bitPos = 0;
        this.bytePos++;
      }
    }
    
    // console.log(`DEBUG: Read code: ${code} (codeSize: ${this.codeSize})`);
    return code;
  }

  decompress() {
    this.resetDictionary();

    let output = [];
    let prevCode = null;
    let code;
    let codeCount = 0;

    const firstCode = this.readCode();
    if (firstCode === this.clearCode) {
      // console.log("DEBUG: Found initial Clear Code, continuing");
      this.resetDictionary();
    } else if (firstCode !== null) {
      // console.log(`DEBUG: First code was ${firstCode}, not Clear Code ${this.clearCode}, processing normally`);
      if (firstCode < this.dict.length && this.dict[firstCode]) {
        output.push(...this.dict[firstCode]);
        prevCode = firstCode;
        // console.log(`DEBUG: Added initial ${this.dict[firstCode].length} pixels to output`);
      } else {
        // console.log(`DEBUG: ERROR - Invalid first code: ${firstCode}`);
        throw new Error(`Invalid first LZW code: ${firstCode}`);
      }
    }

    while ((code = this.readCode()) !== null) {
      codeCount++;
      // console.log(`DEBUG: Processing code #${codeCount}: ${code}`);
      
      if (code === this.clearCode) {
        // console.log("DEBUG: Clear code received, resetting dictionary");
        this.resetDictionary();
        prevCode = null;
        continue;
      }
      if (code === this.endCode) {
        // console.log("DEBUG: End code received, stopping decompression");
        break;
      }

      let entry;
      if (code < this.dict.length && this.dict[code]) {
        entry = this.dict[code];
        // console.log(`DEBUG: Found entry in dict[${code}]: [${entry}]`);
      } else if (code === this.nextCode && prevCode !== null) {
        entry = [...this.dict[prevCode], this.dict[prevCode][0]];
        // console.log(`DEBUG: Special case - code equals nextCode (${this.nextCode}), created entry: [${entry}]`);
      } else {
        // console.log(`DEBUG: ERROR - Invalid code: ${code}`);
        // console.log(`DEBUG: Dict length: ${this.dict.length}, nextCode: ${this.nextCode}, prevCode: ${prevCode}`);
        // console.log(`DEBUG: Dict entries around code: [${code-2}]=${this.dict[code-2]}, [${code-1}]=${this.dict[code-1]}, [${code}]=${this.dict[code]}, [${code+1}]=${this.dict[code+1]}`);
        throw new Error(`Invalid LZW code: ${code}`);
      }

      output.push(...entry);
      // console.log(`DEBUG: Added ${entry.length} pixels to output. Total output length: ${output.length}`);

      if (prevCode !== null) {
        const newEntry = [...this.dict[prevCode], entry[0]];
        this.dict[this.nextCode] = newEntry;
        // console.log(`DEBUG: Added dict[${this.nextCode}] = [${newEntry}]`);
        this.nextCode++;

        if (
          this.nextCode >= (1 << this.codeSize)
          && this.codeSize < 12
        ) {
          this.codeSize++;
          // console.log(`DEBUG: Increased code size to ${this.codeSize}`);
        }
      }
      prevCode = code;
      
      //if (codeCount > 100) {
        // console.log("DEBUG: Stopping after 100 codes for debugging");
        //break;
      //}
    }
    
    // console.log(`DEBUG: Decompression complete. Output length: ${output.length}`);
    return new Uint8Array(output);
  }
}




export default LZWDecoder