// show-structure.js

const fs = require("fs");
const path = require("path");

// Folders/files to ignore
const IGNORE_LIST = new Set([
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    "coverage",
    ".cache",
    ".turbo",
    ".vercel",
    "chunks",
    "objects",
    ".DS_Store",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
]);

function showTree(dir, indent = "") {
    let items;

    try {
        items = fs.readdirSync(dir);
    } catch (err) {
        console.error(`Cannot read directory: ${dir}`);
        return;
    }

    for (const item of items) {
        if (IGNORE_LIST.has(item)) continue;

        const fullPath = path.join(dir, item);

        let stats;
        try {
            stats = fs.statSync(fullPath);
        } catch (err) {
            continue;
        }

        const icon = stats.isDirectory() ? "📁 " : "📄 ";
        console.log(indent + icon + item);

        if (stats.isDirectory()) {
            showTree(fullPath, indent + "   ");
        }
    }
}

// Start from current folder
showTree(".");