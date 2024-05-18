const fs = require("fs");

const inputFilePath = "output.json";
const bigFilePath = "big.json";

// Create streams
const input = fs.createReadStream(inputFilePath, { encoding: "utf-8" });
const bigFile = fs.createWriteStream(bigFilePath, { flags: "w" });

let currentObject = ""; // Stores the JSON object data as string
let braceCount = 0; // Tracks the depth of nested objects
let inObject = false; // Indicates whether we are currently parsing a JSON object

input.on("data", (chunk) => {
  for (let i = 0; i < chunk.length; i++) {
    const ch = chunk[i];

    // Track the start of a JSON object
    if (ch === "{") {
      if (braceCount === 0) {
        // Start of a new JSON object
        currentObject = "";
        inObject = true;
      }
      braceCount++;
    }

    // Append the character to the current object if we're inside an object
    if (inObject) {
      currentObject += ch;
    }

    // Track the end of a JSON object
    if (ch === "}") {
      braceCount--;
      if (braceCount === 0 && inObject) {
        // We've reached the end of a JSON object
        inObject = false;

        // Check the size of the current JSON object
        const size = Buffer.byteLength(currentObject, "utf8");
        if (size >= 400000) {
          // Check if size is greater than 400KB
          bigFile.write(currentObject + "\n");
        }

        // Reset the current object
        currentObject = "";
      }
    }
  }
});

input.on("end", () => {
  console.log("File processing completed.");
  bigFile.end();
});

input.on("error", (error) => {
  console.error("Error reading the input file:", error);
});

bigFile.on("error", (error) => {
  console.error("Error writing to big file:", error);
});
