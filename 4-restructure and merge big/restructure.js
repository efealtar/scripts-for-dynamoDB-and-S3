const fs = require("fs");
const path = require("path");

const inputDir = "parts-bigA";
const outputDir = "output";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Function to extract top-level JSON objects from concatenated JSON string
const extractJsonObjects = (data) => {
  let depth = 0;
  let inString = false;
  let start = 0;
  const jsonObjects = [];

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    if (char === '"' && data[i - 1] !== "\\") {
      inString = !inString;
    } else if (!inString) {
      if (char === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          jsonObjects.push(data.slice(start, i + 1));
        }
      }
    }
  }
  return jsonObjects;
};

fs.readdir(inputDir, (err, files) => {
  if (err) {
    console.error("Error accessing input directory:", err);
    return;
  }

  files
    .filter((file) => path.extname(file) === ".json")
    .forEach((file) => {
      fs.readFile(path.join(inputDir, file), "utf8", (err, data) => {
        if (err) {
          console.error(`Error reading the file ${file}:`, err);
          return;
        }

        const jsonObjects = extractJsonObjects(data);

        jsonObjects.forEach((jsonString, index) => {
          try {
            const jsonObject = JSON.parse(jsonString);
            const hotelGroups = jsonObject.Item.hotels?.L;

            if (!Array.isArray(hotelGroups)) {
              console.error(
                `Error: Expected an array for hotels.L in file ${file} at object ${index}`
              );
              return;
            }

            const chunkSize = 4000;
            for (let i = 0; i < hotelGroups.length; i += chunkSize) {
              const chunk = hotelGroups.slice(i, i + chunkSize);
              const newItem = {
                ...jsonObject.Item,
                hotels: { L: chunk },
                id: { N: `${jsonObject.Item.id.N}.${i / chunkSize}` },
              };
              const outputFile = path.join(
                outputDir,
                `modified_${file.replace(".json", "")}_${index}_${
                  i / chunkSize
                }.json`
              );
              fs.writeFile(
                outputFile,
                JSON.stringify({ Item: newItem }, null, 2),
                "utf8",
                (err) => {
                  if (err) {
                    console.error(`Error writing to ${outputFile}:`, err);
                  } else {
                    console.log(`${outputFile} written successfully.`);
                  }
                }
              );
            }
          } catch (parseError) {
            console.error(
              `Error parsing JSON object ${index} in file ${file}:`,
              parseError
            );
            // Write invalid JSON object to a separate file for further inspection
            const errorFile = path.join(
              outputDir,
              `error_${file}_${index}.json`
            );
            fs.writeFile(errorFile, jsonString, "utf8", (err) => {
              if (err) {
                console.error(`Error writing to ${errorFile}:`, err);
              } else {
                console.log(`${errorFile} written for debugging.`);
              }
            });
          }
        });
      });
    });
});
