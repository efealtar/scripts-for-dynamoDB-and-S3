const fs = require("fs");

// Read the entire file as a single string
fs.readFile("regions.json", "utf8", (err, data) => {
  if (err) {
    logToFileAndConsole("Error reading file:" + err);
    return;
  }

  // Function to test and extract JSON objects from a string
  function extractAndTestJsonObjects(data) {
    let objects = [];
    let startPos = 0;
    let endPos = 0;
    let balance = 0;
    let inString = false;
    let objectCounter = 0;

    for (let i = 0; i < data.length; i++) {
      let char = data[i];

      if (char === '"' && data[i - 1] !== "\\") {
        inString = !inString;
      }

      if (!inString) {
        if (char === "{") {
          if (balance === 0) {
            startPos = i; // Potential beginning of an object
          }
          balance++;
        } else if (char === "}") {
          balance--;
          if (balance === 0) {
            endPos = i;
            // End of an object
            let objString = data.substring(startPos, i + 1);
            let objSizeBytes = Buffer.byteLength(objString, "utf8");
            let objSizeKB = objSizeBytes / 1024;
            objectCounter++;
            let logMessage = `${objectCounter}th object checked, its size is ${objSizeKB.toFixed(
              2
            )} KB`;
            if (objSizeKB > 400) {
              logMessage += " - big file!";
            }
            try {
              JSON.parse(objString); // Test parsing the object
              objects.push(objString); // Store valid JSON object string
              logToFileAndConsole(logMessage);
            } catch (parseError) {
              logToFileAndConsole(
                `Error parsing object at positions ${startPos} to ${endPos}: ${parseError.message}`
              );
              return false; // Stop processing on first error
            }
            // Check for non-whitespace characters between objects
            if (i + 1 < data.length && data[i + 1] !== "{") {
              let nextObjectStart = data.indexOf("{", i + 1);
              let interveningText = data
                .substring(i + 1, nextObjectStart)
                .trim();
              if (interveningText.length > 0) {
                logToFileAndConsole(
                  `Unexpected text between objects at positions ${
                    endPos + 1
                  } to ${nextObjectStart - 1}: "${interveningText}"`
                );
              }
            }
          }
        }
      }
    }

    if (balance !== 0) {
      logToFileAndConsole("Unbalanced braces detected in the file.");
      return false;
    }

    return true;
  }

  // Validate and extract JSON objects
  if (extractAndTestJsonObjects(data)) {
    logToFileAndConsole("All JSON objects are valid.");
  }
});

function logToFileAndConsole(message) {
  console.log(message);
  fs.appendFileSync("report.txt", message + "\n", "utf8");
}
