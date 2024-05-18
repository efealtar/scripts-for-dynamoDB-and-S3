const fs = require("fs");
const { Transform, pipeline } = require("stream");
const util = require("util");
const pipelinePromise = util.promisify(pipeline);

class JsonExtractor extends Transform {
  constructor(options) {
    super(options);
    this.partialData = "";
    this.objects = [];
    this.objectCounter = 0;
    this.startPos = 0;
    this.endPos = 0;
    this.balance = 0;
    this.inString = false;
  }

  _transform(chunk, encoding, callback) {
    this.partialData += chunk.toString();
    this.extractAndTestJsonObjects(this.partialData);
    callback();
  }

  _flush(callback) {
    this.extractAndTestJsonObjects(this.partialData, true);
    callback();
  }

  extractAndTestJsonObjects(data, isFlush = false) {
    for (let i = 0; i < data.length; i++) {
      let char = data[i];

      if (char === '"' && data[i - 1] !== "\\") {
        this.inString = !this.inString;
      }

      if (!this.inString) {
        if (char === "{") {
          if (this.balance === 0) {
            this.startPos = i; // Potential beginning of an object
          }
          this.balance++;
        } else if (char === "}") {
          this.balance--;
          if (this.balance === 0) {
            this.endPos = i;
            // End of an object
            let objString = data.substring(this.startPos, i + 1);
            let objSizeBytes = Buffer.byteLength(objString, "utf8");
            let objSizeKB = objSizeBytes / 1024;
            this.objectCounter++;
            let logMessage = `${
              this.objectCounter
            }th object checked, its size is ${objSizeKB.toFixed(2)} KB`;
            if (objSizeKB > 400) {
              logMessage += " - big file!";
            }
            try {
              JSON.parse(objString); // Test parsing the object
              this.objects.push(objString); // Store valid JSON object string
              logToFileAndConsole(logMessage);
            } catch (parseError) {
              logToFileAndConsole(
                `Error parsing object at positions ${this.startPos} to ${this.endPos}: ${parseError.message}`
              );
              return false; // Stop processing on first error
            }

            if (i + 1 < data.length && data[i + 1] !== "{") {
              let nextObjectStart = data.indexOf("{", i + 1);
              let interveningText = data
                .substring(i + 1, nextObjectStart)
                .trim();
              if (interveningText.length > 0) {
                logToFileAndConsole(
                  `Unexpected text between objects at positions ${
                    this.endPos + 1
                  } to ${nextObjectStart - 1}: "${interveningText}"`
                );
              }
            }
          }
        }
      }
    }

    if (this.balance !== 0 && !isFlush) {
      logToFileAndConsole("Unbalanced braces detected in the file.");
      return false;
    }

    return true;
  }
}

function logToFileAndConsole(message) {
  console.log(message);
  fs.appendFileSync("report.txt", message + "\n", "utf8");
}

async function processFile() {
  try {
    await pipelinePromise(
      fs.createReadStream("regions.json", { encoding: "utf8" }),
      new JsonExtractor()
    );
    logToFileAndConsole("File processing complete.");
  } catch (err) {
    logToFileAndConsole(`Pipeline failed: ${err.message}`);
  }
}

processFile();
