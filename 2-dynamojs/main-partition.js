const fs = require("fs");
const { marshall } = require("@aws-sdk/util-dynamodb");
const readline = require("readline");

// Function to manually parse concatenated JSON objects, process each object, and use "id" as "PK"
function processAndSaveJson(inputFilePath, outputFilePath) {
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

  rl.on("line", (line) => {
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

            // Check if "id" exists; if not, skip or handle as needed
            if (!jsonObject.id) {
              console.error("JSON object missing 'id':", object);
              object = "";
              continue; // Skip this object or you could assign a default PK value
            }

            // Use "Region.id" as the PK value
            jsonObject.PK = "Regions";

            // Marshal the JSON object for DynamoDB and wrap it under an "Item" key
            const marshalledObject = { Item: marshall(jsonObject) };
            outputStream.write(JSON.stringify(marshalledObject) + "\n"); // Write each object on a new line

            object = ""; // Reset object string for the next JSON object
          } catch (error) {
            console.error("Error parsing JSON object:", object, error);
            object = ""; // Reset object string in case of an error
          }
        }
      }
    }
  });

  rl.on("close", () => {
    console.log(
      "Processed and marshalled data has been saved to:",
      outputFilePath
    );
    outputStream.end();
  });

  rl.on("error", (error) => {
    console.error("Error processing concatenated JSON data:", error);
  });

  outputStream.on("error", (error) => {
    console.error("Error writing to output file:", error);
  });
}

// Replace 'input.json' with your file path and specify the output file
processAndSaveJson("regions.json", "st-regions.json");
