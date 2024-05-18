#include <iostream>
#include <fstream>
#include <string>
#include <filesystem>

namespace fs = std::filesystem;

int main() {
    // The path to the directory containing your files
    std::string inputDirectory = "final";

    // Output file
    std::string outputFile = "regions.json";
    std::ofstream out(outputFile, std::ios::binary | std::ios::out);

    if (!out.is_open()) {
        std::cerr << "Failed to open output file." << std::endl;
        return 1;
    }

    // Iterate over each file in the directory
    for (const auto& entry : fs::directory_iterator(inputDirectory)) {
        // Check if it is a file
        if (entry.is_regular_file()) {
            std::ifstream in(entry.path(), std::ios::binary | std::ios::in);

            if (!in.is_open()) {
                std::cerr << "Failed to open input file: " << entry.path() << std::endl;
                continue; // Skip to the next file
            }

            // Stream the contents of the input file to the output file
            out << in.rdbuf();

            // Close the current input file
            in.close();
        }
    }

    // Close the output file
    out.close();

    std::cout << "Merging completed." << std::endl;

    return 0;
}
