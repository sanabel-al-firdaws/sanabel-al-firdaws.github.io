#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const fs_1 = require("fs");
const path_1 = require("path");
const command = process.argv[2];
if (!command)
    throw new Error("Command required: 'docs-markdown fetch'");
if (command === "fetch") {
    const files = (process.argv.length > 3
        ? process.argv[3]
        : process.env.FILES || "")
        .split(",")
        .map((i) => i.trim());
    index_1.fetchGoogleDocsFiles(files);
}
if (command === "convert") {
    const files = (process.argv.length > 3
        ? process.argv[3]
        : process.env.FILES || "")
        .split(",")
        .map((i) => i.trim());
    files.forEach((file) => {
        const fileContents = JSON.parse(fs_1.readFileSync(path_1.join(".", file)).toString());
        const markdown = index_1.googleDocsToMarkdown(fileContents);
        fs_1.writeFileSync(path_1.join(".", `${file.replace(".json", "")}.md`), markdown);
    });
}
//# sourceMappingURL=cli.js.map