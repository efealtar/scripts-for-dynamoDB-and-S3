const fs = require("fs");
const path = require("path");

const inputDir = "parts-bigA";
const outputDir = "output";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

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

        try {
          const jsonObject = JSON.parse(data);
          const hotelGroups = jsonObject.Item.hotels?.L;

          if (!Array.isArray(hotelGroups)) {
            console.error(
              `Error: Expected an array for hotels.L in file ${file}`
            );
            return;
          }

          const chunkSize = 5000;
          for (let i = 0; i < hotelGroups.length; i += chunkSize) {
            const chunk = hotelGroups.slice(i, i + chunkSize);
            const newItem = {
              ...jsonObject.Item,
              hotels: { L: chunk },
              id: { N: `${jsonObject.Item.id.N}.${i / chunkSize}` },
            };
            const outputFile = path.join(
              outputDir,
              `modified_${file.replace(".json", "")}_${i / chunkSize}.json`
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
          console.error(`Error parsing JSON in file ${file}:`, parseError);
        }
      });
    });
});
