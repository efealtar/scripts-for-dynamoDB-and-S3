const fs = require("fs");
const path = require("path");

const inputDir = "parts-big";
const outputDir = "output";

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fskdirSync(outputDir);
}

// Read the input directory
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

        // Split the file data into chunks that could be individual JSON objects
        const potentialJsonObjects = data.split(/(?<=\})\s*(?=\{)/);
        potentialJsonObjects.forEach((objectData, index) => {
          try {
            const jsonObject = JSON.parse(objectData);
            const hotelGroups = jsonObject.hotels.L;
            const keys = Object.keys(hotelGroups);
            const chunks = [];

            // Handle 'id' correctly assuming it might be an object or a complex type
            const originalId = jsonObject.id;

            // Divide hotelGroups into chunks of 50
            for (let i = 0; i < keys.length; i += 5000) {
              let chunk = {};
              keys.slice(i, i + 5000).forEach((key) => {
                chunk[key] = hotelGroups[key];
              });
              chunks.push(chunk);
            }

            // Write each chunk to a separate file
            chunks.forEach((chunk, chunkIndex) => {
              // Append chunk index to the original id, ensure it's treated as a string
              const newId = `${originalId}.${chunkIndex}`;

              // Create a new object with all properties of Item except room_groups
              let newItem = {
                ...jsonObject,
                hotelGroups: chunk,
                id: newId,
              };

              const outputFile = path.join(
                outputDir,
                `modified_${file.replace(
                  ".json",
                  ""
                )}_${index}_${chunkIndex}.json`
              );
              fs.writeFile(
                outputFile,
                JSON.stringify(newItem, null, 2),
                "utf8",
                (err) => {
                  if (err) {
                    console.error(`Error writing to ${outputFile}:`, err);
                  } else {
                    console.log(`${outputFile} written successfully.`);
                  }
                }
              );
            });
          } catch (parseError) {
            console.error(
              `Error parsing JSON in file ${file} at object ${index}:`,
              parseError
            );
          }
        });
      });
    });
});
