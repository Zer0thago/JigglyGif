import fs from "fs/promises";

async function readfile(filename) {
    try {
        const data = await fs.readFile(filename);
        return data;
    } catch (err) {
        console.error(err);
    }
}

async function doesFileExist(filename) {
    try {
        await fs.access(filename);
        return true;
    } catch (err) {
        return false;
    }
}

export { readfile, doesFileExist };