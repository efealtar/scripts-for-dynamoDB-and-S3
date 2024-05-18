const fs = require("fs");
const { parser } = require("stream-json");
const { streamValues } = require("stream-json/streamers/StreamValues");
const bigFilePath = "big.json";

const input = fs.createReadStream("formatted_output.json");
const bigFile = fs.createWriteStream(bigFilePath, { flags: "w" });

const pipeline = input.pipe(parser()).pipe(streamValues());

pipeline.on("data", (data) => {
  const value = data.value;
  const json = JSON.stringify(value);
  const size = Buffer.byteLength(json, "utf8");
  if (size >= 400000) {
    // larger than 400KB
    bigFile.write(json + "\n");
  }
});

pipeline.on("end", () => {
  console.log("Processing completed.");
  bigFile.end();
});

pipeline.on("error", (error) => {
  console.error("Error processing file:", error);
});
