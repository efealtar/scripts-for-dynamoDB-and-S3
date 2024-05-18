#include <iostream>
#include <fstream>
#include <string>
#include <sys/stat.h>
#include <dirent.h> // Directory access

void createDirectory(const char* dir) {
    struct stat info;
    if (stat(dir, &info) != 0 || !(info.st_mode & S_IFDIR)) {
        std::cout << "Creating directory: " << dir << std::endl;
        mkdir(dir, 0777); // Modify permissions as needed
    }
}

int main() {
    DIR *dir;
    struct dirent *ent;
    const char *inputDir = "split";
    const char *bigDir = "parts-big";
    const char *smallDir = "parts-small";

    createDirectory(bigDir);
    createDirectory(smallDir);

    if ((dir = opendir(inputDir)) != NULL) {
        while ((ent = readdir(dir)) != NULL) {
            std::string filename = ent->d_name;
            if (filename == "." || filename == "..") continue; // Skip . and ..

            std::string fullPath = std::string(inputDir) + "/" + filename;
            std::ifstream inputFile(fullPath);
            if (!inputFile.is_open()) {
                std::cerr << "Error opening file: " << fullPath << std::endl;
                continue;
            }

            std::string content((std::istreambuf_iterator<char>(inputFile)),
                                std::istreambuf_iterator<char>());
            inputFile.close();

            std::string object;
            int depth = 0;
            for (char ch : content) {
                object += ch;
                if (ch == '{') depth++;
                if (ch == '}') depth--;

                if (depth == 0 && !object.empty()) {
                    bool isBig = object.size() > 400000; // 400KB
                    std::string outputDir = isBig ? bigDir : smallDir;
                    std::string outputPath = std::string(outputDir) + "/" +(isBig ? "big-" : "small-")+ filename;

                    std::ofstream outputFile(outputPath, std::ios_base::app); // Append mode
                    if (outputFile.is_open()) {
                        outputFile << object;
                        outputFile.close();
                    } else {
                        std::cerr << "Error writing to file: " << outputPath << std::endl;
                    }
                    object.clear();
                }
            }
        }
        closedir(dir);
    } else {
        std::cerr << "Could not open directory: " << inputDir << std::endl;
        return 1;
    }

    return 0;
}
