const fs = require("fs");
const path = require("path");
const { marshall } = require("@aws-sdk/util-dynamodb");
const JSONStream = require("JSONStream");

// Function to manually parse concatenated JSON objects and process each object
function processAndSaveJson(inputFilePath, outputFilePath) {
  try {
    const readStream = fs.createReadStream(inputFilePath, { encoding: "utf8" });
    const writeStream = fs.createWriteStream(outputFilePath, {
      encoding: "utf8",
    });

    let depth = 0;
    let object = "";
    let insideString = false;
    let escape = false;

    readStream.on("data", (chunk) => {
      for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i];
        object += ch;

        if (insideString) {
          if (ch === '"' && !escape) {
            insideString = false;
          }
          escape = ch === "\\" && !escape;
        } else {
          if (ch === '"') {
            insideString = true;
          } else if (ch === "{") {
            depth++;
          } else if (ch === "}") {
            depth--;
            if (depth === 0) {
              try {
                const jsonObject = JSON.parse(object);

                if (
                  !jsonObject.id ||
                  !jsonObject.region ||
                  !jsonObject.region.id
                ) {
                  console.error(
                    "JSON object missing required fields:",
                    jsonObject
                  );
                } else {
                  jsonObject.PK = jsonObject.region.id;
                  jsonObject.SK = jsonObject.id;
                  const marshalledObject = { Item: marshall(jsonObject) };
                  writeStream.write(JSON.stringify(marshalledObject) + "\n");
                }
              } catch (error) {
                console.error("Invalid JSON object:", object);
              }
              object = "";
            }
          }
        }
      }
    });

    readStream.on("end", () => {
      console.log(
        "Processed and marshalled data has been saved to:",
        outputFilePath
      );
      writeStream.end();
    });

    readStream.on("error", (error) => {
      console.error("Error reading input file:", error);
    });

    writeStream.on("error", (error) => {
      console.error("Error writing to output file:", error);
    });
  } catch (error) {
    console.error("Error processing concatenated JSON data:", error);
  }
}

// Function to process all files in the input folder
function processAllFilesInFolder(inputFolderPath, outputFolderPath) {
  try {
    const files = fs.readdirSync(inputFolderPath);
    files.forEach((file) => {
      const inputFilePath = path.join(inputFolderPath, file);
      const outputFilePath = path.join(outputFolderPath, file);
      processAndSaveJson(inputFilePath, outputFilePath);
    });
    console.log("All files processed successfully.");
  } catch (error) {
    console.error("Error processing files in folder:", error);
  }
}

// Define the input and output folders
const inputFolderPath = "small_parts";
const outputFolderPath = "output";

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolderPath)) {
  fs.mkdirSync(outputFolderPath);
}

// Process all files in the input folder
processAllFilesInFolder(inputFolderPath, outputFolderPath);
