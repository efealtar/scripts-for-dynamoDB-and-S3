const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "region.json.zst");
const outputPath = path.join(__dirname, "regions.json");

function decompressFile() {
  try {
    console.log("Starting decompression using zstd CLI...");
    // Command to decompress the file
    execSync(`zstd -d ${inputPath} -o ${outputPath}`);

    console.log(`Decompression complete. File written to ${outputPath}`);
  } catch (error) {
    console.error("An error occurred during decompression:", error);
  }
}

decompressFile();
