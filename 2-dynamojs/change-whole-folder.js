const fs = require("fs");
const path = require("path");
const { marshall } = require("@aws-sdk/util-dynamodb");
const readline = require("readline");

// Function to manually parse concatenated JSON objects, process each object, and use "id" as "PK"
async function processAndSaveJson(inputFilePath, outputFilePath) {
  const inputStream = fs.createReadStream(inputFilePath, { encoding: "utf8" });
  const outputStream = fs.createWriteStream(outputFilePath, {
    encoding: "utf8",
  });

  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let depth = 0;
  let object = "";

  for await (const line of rl) {
    for (let ch of line) {
      object += ch;

      if (ch === "{") {
        depth++;
      }
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          // When depth returns to 0, we have a complete JSON object
          try {
            const jsonObject = JSON.parse(object);

            // Check if "id" exists at the root level; if not, skip or handle as needed
            if (!jsonObject.hasOwnProperty("id")) {
              console.error("JSON object missing 'id':", object);
              object = "";
              continue; // Skip this object or you could assign a default PK value
            }

            // Use "Region.id" as the PK value
            jsonObject.PK = "regions";

            // Marshal the JSON object for DynamoDB and wrap it under an "Item" key
            const marshalledObject = { Item: marshall(jsonObject) };
            outputStream.write(JSON.stringify(marshalledObject) + "\n"); // Write to the output stream
          } catch (error) {
            console.error("Error parsing JSON object:", object, error);
          }

          object = ""; // Reset object string for the next JSON object
        }
      }
    }
  }

  // Close the output stream when done
  outputStream.end();
  console.log(
    "Processed and marshalled data with 'Item' and dynamic 'PK' has been saved to:",
    outputFilePath
  );
}

// Function to process all files in the input folder
async function processAllFilesInFolder(inputFolderPath, outputFolderPath) {
  try {
    const files = fs.readdirSync(inputFolderPath);
    for (const file of files) {
      const inputFilePath = path.join(inputFolderPath, file);
      const outputFilePath = path.join(outputFolderPath, file);
      await processAndSaveJson(inputFilePath, outputFilePath);
    }
    console.log("All files processed successfully.");
  } catch (error) {
    console.error("Error processing files in folder:", error);
  }
}

// Define the input and output folders
const inputFolderPath = "input";
const outputFolderPath = "output";

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolderPath)) {
  fs.mkdirSync(outputFolderPath);
}

// Process all files in the input folder
processAllFilesInFolder(inputFolderPath, outputFolderPath);
