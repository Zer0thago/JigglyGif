# JigglyGif
A library-free GIF image extractor built entirely from scratch in pure Node.js

✨ What makes JigglyGif special?
- Zero dependencies - JigglyGif is built from the ground up without relying on any external libraries or packages. Every component is implemented from scratch:

- Custom GIF parser - Reads and decodes GIF file structure natively

- Built-in LZW decompressor - Implements the Lempel-Ziv-Welch algorithm for GIF decompression

- Frame composition engine - Handles GIF animation layering and disposal methods

- Pure Node.js implementation - Uses only built-in Node.js modules (fs, Buffer)

## Usage:
```js
import jigglygif from "./lib/index.js";

async function main()
{
    await jigglygif.ExtractFramesByFileName("file.gif")
    // or
    await jigglygif.ExtractFramesByBytes(/* file bytes */)
}

main()
```
