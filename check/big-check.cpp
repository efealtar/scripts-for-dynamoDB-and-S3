#include <iostream>
#include <fstream>
#include <string>

int main() {
    std::ifstream file("hotels.json");
    if (!file.is_open()) {
        std::cerr << "Failed to open file." << std::endl;
        return 1;
    }

    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();

    std::string object;
    int depth = 0;
    bool inQuotes = false;
    char prevChar = 0;

    for (char ch : content) {
        object += ch;

        // Toggle inQuotes based on quotes and ignore braces inside quotes
        if (ch == '"' && prevChar != '\\') { // Check for unescaped quotes
            inQuotes = !inQuotes;
        }

        if (!inQuotes) {
            if (ch == '{') depth++;
            if (ch == '}') depth--;
        }

        prevChar = ch; // Update previous character

        // When a complete object is formed
        if (depth == 0 && !object.empty()) {
            // Check size in bytes
            bool isBig = object.size() > 400000; // 400 KB
            if (isBig) {
                std::cout << "Bigger file detected!" << std::endl;
            } else {
                std::cout << "All safe" << std::endl;
            }
            object.clear(); // Reset the object string for the next JSON object
        }
    }

    return 0;
}
