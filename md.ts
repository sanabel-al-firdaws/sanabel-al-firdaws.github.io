import { promises as fs, type PathLike } from "fs";
import {
  LoroDoc,
  LoroList,
  LoroMap,
  LoroText,
  LoroTree,
  type TreeID,
} from "loro-crdt";
import * as path from "path";
import * as arabicStrings from "@flowdegree/arabic-strings";
import { Editor, getSchema } from "@tiptap/core";
import {
  ATTRIBUTES_KEY,
  CHILDREN_KEY,
  createNodeFromLoroObj,
  NODE_NAME_KEY,
} from "loro-prosemirror";

import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";
import { render_options, tiptapExtensions } from "./src/js/extensions";
import { get_all_update_files } from "./src/js/extensions";
type LoroChildrenListType = LoroList<LoroMap<LoroNodeContainerType> | LoroText>;
type LoroNodeContainerType = {
  [CHILDREN_KEY]: LoroChildrenListType;
  [ATTRIBUTES_KEY]: LoroMap;
  [NODE_NAME_KEY]: string;
};
type LoroNode = LoroMap<LoroNodeContainerType>;

let schema = getSchema(tiptapExtensions);

let files = await get_all_update_files(process.env.TOKEN_CMS);

let array_files = files?.map((updateString) => {
  if (updateString) {
    const binaryString = atob(updateString);
    const snapshot = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      snapshot[i] = binaryString.charCodeAt(i);
    }

    return [...snapshot];
  }
});
if (array_files) {
  let doc = new LoroDoc();
  //@ts-ignore
  doc.importBatch(array_files);
  let tree = doc.getTree("tree");
  let data = tree.toArray()[0];

  // Remove all existing .mdoc files before creating new structure
  const contentDir = "./src/content/docs/";
  console.log("Removing existing .mdoc files...");
  await removeMdocFiles(contentDir);
  console.log("Cleanup complete. Creating new structure...");

  // Create folders and files recursively
  async function createStructure(
    node: {
      id: any;
      parent?: `${number}@${number}`;
      index?: number;
      fractionalIndex?: string;
      meta: LoroMap;
      children: any;
    },
    basePath = "./"
  ) {
    if (!node.meta || !node.meta.get("name")) {
      console.warn(
        "Skipping node with missing meta or name:",
        node.meta.entries()
      );
      return;
    }
    let name = node.meta.get("name") as string;
    let trimmed_name = name.trim();

    if (node.meta.get("item_type") === "folder") {
      // let name_trimmed = trimmed_name.replace(/\s+/g, "_");
      let name_slug = arabicStrings.removeTashkel(trimmed_name);

      let currentPath = path.join(basePath, name_slug);
      try {
        await fs.mkdir(currentPath, { recursive: true });
        console.log(`Created folder: ${currentPath}`);

        // Process children after creating the folder
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            await createStructure(child, currentPath);
          }
        }
      } catch (error) {
        console.error(`Error creating folder ${currentPath}:`, error);
      }
    } else {
      // let name_trimmed = trimmed_name.replace(/\s+/g, "_");
      let name_slug = arabicStrings.removeTashkel(trimmed_name);

      let currentPath = path.join(basePath, name_slug);

      if (node.meta.get("draft")) {
        console.warn("Skipping node that is a draft:", node.meta.entries());
        return;
      }
      try {
        // Ensure parent directory exists before creating file
        await fs.mkdir(path.dirname(currentPath), { recursive: true });

        const filePath = "./" + currentPath + ".mdoc";
        // console.log(basePath, "basePath");
        console.log(filePath, "filePath");
        // let slug = filePath.slice(19).replace(/.mdoc/g, "");
        // let is_at_root = isAtBasePath(filePath, basePath);
        // console.log("is file at basePath : " + is_at_root);
        // let tree = doc.getTree("tree");
        // let tree_doc = tree.getNodeByID(node.id as TreeID)!;

        let prosemirrorNode = createNodeFromLoroObj(
          schema,
          node.meta.get("content") as LoroNode,
          new Map()
        );
        let markdown = renderToMarkdown({
          content: prosemirrorNode.toJSON(),
          extensions: tiptapExtensions, //@ts-ignore
          options: render_options,
        });

        let name = node.meta.get("name") as string;
        let trimmed_name = name.trim();

        await fs.writeFile(
          filePath,
          `---
title: ${trimmed_name}      
---

${markdown}
`
        );

        console.log(`Created file: ${filePath}`);
      } catch (error) {
        console.error(
          `Error creating file for node ${node.meta.get("name")}:`,
          error
        );
      }
    }
  }
  function isAtBasePath(filePath: string, basePath: string): boolean {
    // Normalize paths by removing trailing slashes and resolving relative components
    const normalizePath = (path: string): string => {
      // Convert to absolute-style path for consistent handling
      const absolutePath = path.startsWith("./") ? path.slice(2) : path;

      // Remove trailing slash
      const trimmed = absolutePath.replace(/\/+$/, "");

      // Handle relative path components
      const parts = trimmed.split("/").filter((part) => part !== "");
      const resolved: string[] = [];

      for (const part of parts) {
        if (part === "..") {
          resolved.pop();
        } else if (part !== ".") {
          resolved.push(part);
        }
      }

      return resolved.join("/");
    };

    const normalizedFilePath = normalizePath(filePath);
    const normalizedBasePath = normalizePath(basePath);

    // Check if filePath starts with basePath
    if (normalizedBasePath === "") {
      return true; // Root/empty path contains everything
    }

    // Check if file is directly in the base directory (not in subdirectories)
    if (normalizedFilePath.startsWith(normalizedBasePath + "/")) {
      const relativePath = normalizedFilePath.slice(
        normalizedBasePath.length + 1
      );
      // Return true only if there are no additional path separators (no subdirectories)
      return !relativePath.includes("/");
    }

    // Check if file path exactly matches the base path
    return normalizedFilePath === normalizedBasePath;
  }
  (async () => {
    try {
      if (data.children) {
        for (const child of data.children) {
          await createStructure(child, "./src/content/docs/");
        }
        console.log("Folder structure created successfully!");
      } else {
        console.log("No children found in data structure");
      }
    } catch (error) {
      console.error("Error creating folder structure:", error);
    }
  })();
}

async function loadSnapshot(filePath: PathLike | fs.FileHandle) {
  try {
    // Read file as buffer
    const buffer = await fs.readFile(filePath);

    // Convert buffer to Uint8Array
    const snapshot = new Uint8Array(buffer);

    return snapshot;
  } catch (error) {
    console.error("Error loading file:", error);
    throw error;
  }
}

// Function to recursively find and remove all .mdoc files in a directory
async function removeMdocFiles(dirPath: string) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        await removeMdocFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".mdoc")) {
        // Remove .mdoc files
        await fs.unlink(fullPath);
        console.log(`Removed file: ${fullPath}`);
      }
    }
  } catch (error) {
    // If directory doesn't exist, that's okay - we'll create it later
    //@ts-ignore
    if (error.code !== "ENOENT") {
      console.error(`Error processing directory ${dirPath}:`, error);
    }
  }
}
