import { checksigniature } from "./src/headerUtils.js";
import { extractAllFrames } from "./src/frameUtils.js";
import { readfile, doesFileExist } from "./src/fileUtils.js";


async function ExtractFramesByFileName(filename) {
    if(!await doesFileExist(filename)) {
        console.error(`File ${filename} does not exist`);
        return;
    }
    const gif = await readfile(filename);
    extractAllFrames(gif);
}

async function ExtractFramesByBytes(bytes)
{
    if(!bytes)
    {
        console.error("No bytes provided");
        return null;
    }
    extractAllFrames(bytes);
}

export default {
    ExtractFramesByFileName,
    ExtractFramesByBytes
}
