import { promises as fs, type PathLike } from "fs";
import {
  LoroDoc,
  LoroList,
  LoroMap,
  LoroText,
  LoroTree,
  type TreeID,
} from "loro-crdt";
import path from "path";
import { Editor, getSchema } from "@tiptap/core";
import {
  ATTRIBUTES_KEY,
  CHILDREN_KEY,
  createNodeFromLoroObj,
  LoroCursorPlugin,
  LoroSyncPlugin,
  LoroUndoPlugin,
  NODE_NAME_KEY,
} from "loro-prosemirror";
import TableOfContents from "@tiptap/extension-table-of-contents";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";

// import { generateHTML } from "@tiptap/html/server";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";
import TurndownService from "turndown";
type LoroChildrenListType = LoroList<LoroMap<LoroNodeContainerType> | LoroText>;
type LoroNodeContainerType = {
  [CHILDREN_KEY]: LoroChildrenListType;
  [ATTRIBUTES_KEY]: LoroMap;
  [NODE_NAME_KEY]: string;
};
type LoroNode = LoroMap<LoroNodeContainerType>;

let extensions = [
  TableOfContents,
  // DragHandle,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "What’s the title?";
      }
      return "Write Something...";
    },
  }),
  StarterKit.configure({
    undoRedo: false, // Disable built-in undo/redo since we're using collaboration
  }),
];

let schema = getSchema(extensions);

// Convert to HTML
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

// Usage
await loadSnapshot("./MyNoteBookFile.bin").then((snapshot) => {
  let doc = LoroDoc.fromSnapshot(snapshot);
  let tree = doc.getTree("tree");
  let data = tree.toArray()[0];

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

    let name_slug = trimmed_name.replace(/\s+/g, "-");

    const currentPath = path.join(basePath, name_slug);

    if (node.meta.get("item_type") === "folder") {
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
      try {
        // Ensure parent directory exists before creating file
        await fs.mkdir(path.dirname(currentPath), { recursive: true });
        const filePath = "./" + currentPath + ".mdoc";
        console.log(basePath, "basePath");
        console.log(filePath, "filePath");
        let is_at_root = isAtBasePath(filePath, basePath);
        console.log("is file at basePath : " + is_at_root);
        // let tree = doc.getTree("tree");
        // let tree_doc = tree.getNodeByID(node.id as TreeID)!;

        let prosemirrorNode = createNodeFromLoroObj(
          schema,
          node.meta.get("content") as LoroNode,
          new Map()
        );
        let markdown = renderToMarkdown({
          content: prosemirrorNode.toJSON(),
          extensions,
        });
        // For Node.js

        // var turndownService = new TurndownService({ headingStyle: "atx" });
        // var markdown = turndownService.turndown(html);

        // console.log(test);
        let name = node.meta.get("name") as string;
        let trimmed_name = name.trim();

        await fs.writeFile(
          filePath,
          `---
title: ${trimmed_name}      
slug: ${
            //@ts-ignore
            trimmed_name.toLowerCase().replace(/\s+/g, "-")
          }      

---


${
  markdown
  // .replace(
  //   /<div class="bn-block-content" data-content-type="toggleListItem">\s*<p class="([^"]*)">(.*?)<\/p>\s*<\/div>\s*(<div class="bn-block-group"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/gs,
  //   `<details>\n  <summary class="$1">$2</summary>\n$3\n</details>`
  // )
}
          
          


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
});
