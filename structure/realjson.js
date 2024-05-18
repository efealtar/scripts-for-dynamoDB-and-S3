const fs = require("fs");
const inputFilePath = "output.json";
const outputFilePath = "formatted_output.json";

const readStream = fs.createReadStream(inputFilePath, { encoding: "utf-8" });
const writeStream = fs.createWriteStream(outputFilePath, { flags: "w" });

let isFirstObject = true;

writeStream.write("["); // Start of JSON array

readStream.on("data", (chunk) => {
  const objects = chunk.split("}{").join("},{"); // Properly separate the JSON objects
  if (!isFirstObject) {
    writeStream.write(",");
  }
  writeStream.write(objects);
  isFirstObject = false;
});

readStream.on("end", () => {
  writeStream.write("]"); // End of JSON array
  writeStream.end();
  console.log("Preprocessing completed.");
});

readStream.on("error", (error) => {
  console.error("Error reading the input file:", error);
});

writeStream.on("error", (error) => {
  console.error("Error writing to output file:", error);
});
