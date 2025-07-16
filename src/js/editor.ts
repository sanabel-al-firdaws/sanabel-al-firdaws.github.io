// import { Editor, Extension } from "@tiptap/core";
import { keymap } from "@tiptap/pm/keymap";

// Yjs imports (no WebsocketProvider since we're using custom WebSocket)
import Dexie, { type EntityTable } from "dexie";

import {
  LoroSyncPlugin,
  LoroUndoPlugin,
  redo,
  undo,
  CursorAwareness,
  LoroCursorPlugin,
} from "loro-prosemirror";

import {
  LoroDoc,
  LoroTree,
  LoroTreeNode,
  LoroMap,
  LoroText,
  type ContainerID,
  type TreeID,
  type Container,
} from "loro-crdt";

const ROOT_DOC_KEY = "0@14167320934836008919";

function getRandomAnimalName() {
  const animals = [
    "Lion",
    "Tiger",
    "Elephant",
    "Giraffe",
    "Zebra",
    "Monkey",
    "Panda",
    "Koala",
    "Kangaroo",
    "Dolphin",
    "Whale",
    "Shark",
    "Eagle",
    "Owl",
    "Parrot",
    "Penguin",
    "Flamingo",
    "Bear",
    "Wolf",
    "Fox",
    "Rabbit",
    "Deer",
    "Horse",
    "Cat",
    "Hamster",
    "Hedgehog",
    "Squirrel",
    "Raccoon",
    "Otter",
    "Seal",
    "Turtle",
    "Frog",
    "Butterfly",
    "Bee",
    "Ladybug",
    "Spider",
    "Octopus",
    "Jellyfish",
    "Starfish",
    "Crab",
    "Lobster",
    "Shrimp",
    "Salmon",
    "Tuna",
    "Goldfish",
    "Seahorse",
    "Crocodile",
    "Lizard",
    "Snake",
    "Chameleon",
  ];

  return animals[Math.floor(Math.random() * animals.length)];
}

// Function to get a random color in hex format
function getRandomColor() {
  const colors = [
    "#6DFF7E", // Green
    "#FF6D6D", // Red
    "#6D9EFF", // Blue
    "#FFD66D", // Yellow
    "#FF6DFF", // Magenta
    "#6DFFFF", // Cyan
    "#FF9D6D", // Orange
    "#A06DFF", // Purple
    "#FF6DA0", // Pink
    "#6DFFA0", // Mint
    "#FFA06D", // Peach
    "#A0FF6D", // Lime
    "#6DA0FF", // Sky Blue
    "#FF6DDE", // Hot Pink
    "#DFF6D6", // Light Green
    "#FFB3BA", // Light Pink
    "#BAFFC9", // Light Mint
    "#BAE1FF", // Light Blue
    "#FFFFBA", // Light Yellow
    "#FFDFBA", // Light Orange
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

//@ts-ignore
import { Ok, Error } from "../gleam.mjs";

export async function check_password(
  password: string,
  on_password_checked: (arg0: string) => void
) {
  const octokit = new Octokit({
    auth: password,
  });

  try {
    const { data } = await octokit.rest.users.getAuthenticated();
    localStorage.setItem("github_token", password);
    on_password_checked(new Ok(nil));
  } catch (error) {
    localStorage.removeItem("github_token");
    on_password_checked(new Error(nil));
    console.error("Token is invalid:", error);
  }
}
export function save_document() {
  const messageEvent = new CustomEvent("save_doc");
  document.dispatchEvent(messageEvent);
}

export async function save_function(room_id: string, doc: LoroDoc) {
  let files = await get_all_update_files();

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
    console.log(array_files);
    //@ts-ignore
    doc.importBatch(array_files);
  }

  const snapshot = doc.export({ mode: "snapshot" });
  await save_loro_doc(room_id, snapshot);

  sync_to_repo(snapshot);

  const messageEvent = new CustomEvent("state_saved");
  document.dispatchEvent(messageEvent);
}

export function user_selected_note(note_id: String) {
  const messageEvent = new CustomEvent("user-selected-note", {
    detail: note_id,
  });
  document.dispatchEvent(messageEvent);
}

export function download_notebook(doc: LoroDoc) {
  let snapshot = doc.export({ mode: "snapshot" });
  // Convert Uint8Array to Blob
  const blob = new Blob([snapshot], { type: "application/octet-stream" });

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "MyNoteBook.bin"; // or whatever filename you want
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
//@ts-ignore
import { joinRoom } from "trystero";
import { Octokit } from "octokit";
import DragHandle from "@tiptap/extension-drag-handle";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import TableOfContents from "@tiptap/extension-table-of-contents";
import Aside from "./extensions/Aside";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";
import Highlight from "@tiptap/extension-highlight";
import {
  Details,
  DetailsSummary,
  DetailsContent,
} from "@tiptap/extension-details";
import FloatingMenu from "@tiptap/extension-floating-menu";

import {
  get_all_update_files,
  render_options,
  tiptapExtensions,
} from "./extensions";

export async function init_tiptap(doc: LoroDoc) {
  let editor: Editor | undefined;
  let room_id = "noter";
  const config = { appId: "sakwdakwdakowdapkwdpkwdkemonas" };
  const room = joinRoom(config, "errgagrgdrdrgrgddrgeaerrgf");

  const awareness = new CursorAwareness(doc.peerIdStr);

  const mainApp = document.querySelector("#main-app");

  let selected_document = localStorage.getItem("last-selected-note");
  let tiptapEditor;
  document.addEventListener("save_doc", () => {
    save_function(room_id, doc);
  });
  let render_editor = () => {
    let tree = doc.getTree("tree");
    let tree_doc = tree
      .getNodeByID(selected_document as TreeID)!
      .data.getOrCreateContainer("content", new LoroMap());

    const LoroPlugins = Extension.create({
      name: "loro-plugins",
      addProseMirrorPlugins() {
        return [
          LoroSyncPlugin({
            //@ts-ignore
            doc,
            containerId: tree_doc.id,
          }),
          LoroUndoPlugin({ doc }),
          LoroCursorPlugin(awareness, {
            user: {
              name: getRandomAnimalName(),
              color: getRandomColor(),
            },
          }),
          keymap({ "Mod-z": undo, "Mod-y": redo, "Mod-Shift-z": redo }),
        ];
      },
    });

    // menu.classList.add("menu");
    // menu.innerHTML = "Menu go br";

    let menu = document.querySelector(".menu")!;

    let extensions = [
      LoroPlugins,
      FloatingMenu.configure({
        options: {
          strategy: "absolute",
          placement: "left",
          inline: false,
          // hide: true,
        },
        //@ts-ignore
        element: menu,
      }),
      ...tiptapExtensions,
    ];

    if (editor) {
      editor.destroy();
    }
    editor = new Editor({
      // content: ``,
      extensions,

      onCreate(props) {
        props.editor?.setEditable(true);
      },
      element: document.querySelector(".editor")!,
      editable: false,
    });
    //@ts-ignore
    window.editor = editor;
    //@ts-ignore
    window.create_link = () => {
      const url = window.prompt("URL");

      if (url) {
        editor!.commands.setLink({ href: url, target: "_blank" });
      }
    };

    // {
    //

    document.querySelector(".editor")!.addEventListener("click", () => {
      console.log(
        renderToMarkdown({
          content: editor!.getJSON(),
          extensions, //@ts-ignore
          options: render_options,
        })
      );
    });

    // let root = tree.getNodeByID(ROOT_DOC_KEY);
    // let json = JSON.stringify(editor.state.schema);

    // root?.data.set("state", json);
  };
  document.addEventListener("user-selected-note", (e) => {
    //@ts-ignore
    localStorage.setItem("last-selected-note", e.detail);

    //@ts-ignore
    selected_document = e.detail;

    render_editor();
  });

  if (selected_document) {
    render_editor();
  }

  const [sendUpdate, getUpdate] = room.makeAction("update");
  const [sendAwareness, getAwareness] = room.makeAction("awareness");

  room.onPeerJoin((peer_id: any) => {
    let update = doc.export({ mode: "snapshot" });

    sendUpdate(update, peer_id);
  });

  getUpdate((update: any, peer: any) => {
    //@ts-ignore
    doc.import(update);
  });

  doc.subscribe((e) => {
    let update = doc.export({ mode: "update" });

    sendUpdate(update);
  });
  let debounceTimer: NodeJS.Timeout | undefined;
  getAwareness((update: any, peer: any) => {
    //@ts-ignore
    awareness.apply(update);
  });
  awareness.addListener(async (update, origin) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer with 100ms delay
    debounceTimer = setTimeout(async () => {
      if (origin === "local") {
        if (selected_document) {
          const update = awareness.encode([doc.peerIdStr]);
          sendAwareness(update);
        }
      }
    }, 0);
  });

  //     livekitRoom.on("participantConnected", async (participant) => {

  //       const writer = await livekitRoom.localParticipant.streamBytes({
  //         // All byte streams must have a name, which is like a filename
  //         name: "loro-update",
  //         // Fixed typo: "updare" -> "update"
  //         topic: "loro-update",
  //       });

  //       const chunkSize = 15000; // 15KB, a recommended max chunk size

  //       // Stream the Uint8Array update data in chunks
  //       for (let i = 0; i < update.length; i += chunkSize) {
  //         const chunk = update.slice(i, i + chunkSize);
  //         await writer.write(chunk);
  //       }

  //       await writer.close();
  //     });
  //     livekitRoom.on("connected", async () => {
  //       let update = doc.export({ mode: "update" });

  //       const writer = await livekitRoom.localParticipant.streamBytes({
  //         // All byte streams must have a name, which is like a filename
  //         name: "loro-update",
  //         // Fixed typo: "updare" -> "update"
  //         topic: "loro-update",
  //       });

  //       const chunkSize = 15000; // 15KB, a recommended max chunk size

  //       // Stream the Uint8Array update data in chunks
  //       for (let i = 0; i < update.length; i += chunkSize) {
  //         const chunk = update.slice(i, i + chunkSize);
  //         await writer.write(chunk);
  //       }

  //       await writer.close();

  //       doc.subscribe(async (e) => {
  //         let update = doc.export({ mode: "update" });

  //         const writer = await livekitRoom.localParticipant.streamBytes({
  //           // All byte streams must have a name, which is like a filename
  //           name: "loro-update",
  //           // Fixed typo: "updare" -> "update"
  //           topic: "loro-update",
  //         });

  //         const chunkSize = 15000; // 15KB, a recommended max chunk size

  //         // Stream the Uint8Array update data in chunks
  //         for (let i = 0; i < update.length; i += chunkSize) {
  //           const chunk = update.slice(i, i + chunkSize);
  //           await writer.write(chunk);
  //         }

  //         await writer.close();
  //       });

  //       let debounceTimer;

  //       awareness.addListener(async (update, origin) => {
  //         // Clear existing timer
  //         if (debounceTimer) {
  //           clearTimeout(debounceTimer);
  //         }

  //         // Set new timer with 100ms delay
  //         debounceTimer = setTimeout(async () => {
  //           if (origin === "local") {
  //             if (selected_document) {
  //               const update = awareness.encode([doc.peerIdStr]);

  //               const writer = await livekitRoom.localParticipant.streamBytes({
  //                 // All byte streams must have a name, which is like a filename
  //                 name: selected_document,
  //                 // Fixed typo: "updare" -> "update"
  //                 topic: "loro-awareness",
  //               });

  //               const chunkSize = 15000; // 15KB, a recommended max chunk size

  //               // Stream the Uint8Array update data in chunks
  //               for (let i = 0; i < update.length; i += chunkSize) {
  //                 const chunk = update.slice(i, i + chunkSize);
  //                 await writer.write(chunk);
  //               }

  //               await writer.close();
  //             }
  //           }
  //         }, 100);
  //       });
  //     });

  //     livekitRoom.registerByteStreamHandler(
  //       "loro-update",
  //       async (reader, participantInfo) => {
  //         const info = reader.info;

  //         // Option 2: Get the entire file after the stream completes.
  //         const result = new Blob(await reader.readAll(), {
  //           type: info.mimeType,
  //         });

  //         const update = new Uint8Array(await result.arrayBuffer());
  //         doc.import(update);
  //       }
  //     );
  //     livekitRoom.registerByteStreamHandler(
  //       "loro-awareness",
  //       async (reader, participantInfo) => {
  //         const info = reader.info;

  //         // Option 2: Get the entire file after the stream completes.
  //         const result = new Blob(await reader.readAll(), {
  //           type: info.mimeType,
  //         });

  //         const update = new Uint8Array(await result.arrayBuffer());
  //         awareness.apply(update);
  //       }
  //     );
  //   }
  // });
}
export async function sync_to_repo(update: Uint8Array) {
  let device_id = localStorage.getItem("github_device_id");

  if (!device_id) {
    device_id = crypto.randomUUID();
    localStorage.setItem("github_device_id", device_id);
  }

  let github_token = localStorage.getItem("github_token");
  const octokit = new Octokit({ auth: github_token });

  const filePath = device_id + "update.bin";

  try {
    // First, try to get the existing file to retrieve its SHA
    let sha;
    try {
      const existingFile = await octokit.rest.repos.getContent({
        owner: "sanabel-al-firdaws",
        repo: "sanabel-al-firdaws-cms",
        // branch: "p2p-notebook",
        path: filePath,
      });

      // If file exists, get its SHA
      if (
        !Array.isArray(existingFile.data) &&
        existingFile.data.type === "file"
      ) {
        sha = existingFile.data.sha;
      }
    } catch (error) {
      // File doesn't exist yet, that's fine - we'll create it
      console.log("File doesn't exist yet, creating new file");
    }

    // Create or update the file
    const response = await octokit.rest.repos.createOrUpdateFileContents({
      owner: "sanabel-al-firdaws",
      // branch: "p2p-notebook",
      repo: "sanabel-al-firdaws-cms",
      content: btoa(String.fromCharCode(...update)),
      path: filePath,
      message: "uploaded snapshot",
      ...(sha && { sha }), // Only include SHA if we have one
    });

    console.log("File uploaded successfully:", response.data);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}
export function delete_db() {
  indexedDB.deleteDatabase("matrix-js-sdk::matrix-sdk-crypto");
}

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Editor, Extension, generateJSON, NodeView } from "@tiptap/core";
import { nil } from "../../build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs";

export function make_draggable(folders_and_items: [HTMLElement]) {
  folders_and_items.forEach((element) => {
    draggable({
      element: element,
    });
  });
}

export function make_drop_target(
  folders: [HTMLElement],
  handleDragEnter: (arg0: string | undefined) => void,
  handleDragLeave: (arg0: string | undefined) => void,
  handleDrop: (arg0: string | undefined, arg1: string | undefined) => void
) {
  folders.forEach((folder_element) => {
    dropTargetForElements({
      element: folder_element,
      canDrop(e) {
        let item = e.source.element.dataset.drag_id;
        let drop_target = folder_element.dataset.drag_id;
        if (item === drop_target) {
          return false;
        }
        if (
          folder_element.dataset.drag_id === e.source.element.dataset.parent_id
        ) {
          return false;
        }
        if (
          folder_element.dataset.drag_id === folder_element.dataset.parent_id
        ) {
          return false;
        } else {
          return true;
        }
      },
      onDragEnter: () => {
        handleDragEnter(folder_element.dataset.drag_id);
      },
      onDragLeave: () => {
        handleDragLeave(folder_element.dataset.drag_id);
      },

      onDrop: (e) => {
        let item = e.source.element.dataset.drag_id;

        let drop_target = folder_element.dataset.drag_id;
        let drop_target_type = folder_element.dataset.item_type;
        let drop_target_parent_id = folder_element.dataset.parent_id;

        if (drop_target_type === "folder") {
          handleDrop(item, drop_target);
        } else {
          handleDrop(item, drop_target_parent_id);
        }
      },
    });
  });
}

class AutoSaver {
  room_id: string;
  doc: LoroDoc;
  hasChanges: boolean;
  intervalSeconds: number;
  constructor(
    room_id: string,
    doc: LoroDoc<Record<string, Container>>,
    intervalSeconds = 300
  ) {
    this.room_id = room_id;
    this.doc = doc;
    this.hasChanges = false;
    this.intervalSeconds = intervalSeconds;
    this.startAutoSave();
  }

  markChanged() {
    this.hasChanges = true;
  }

  async conditionalSave() {
    if (this.hasChanges === true) {
      save_function(this.room_id, this.doc);

      this.hasChanges = false;
    }
  }

  async startAutoSave() {
    setInterval(async () => {
      await this.conditionalSave();
    }, this.intervalSeconds * 1000);
  }
}

export async function get_tree(
  doc: LoroDoc,
  room_id: string,
  on_tree: (arg0: string) => void
) {
  let tree: LoroTree = doc.getTree("tree");
  // tree.enableFractionalIndex(0);
  // let root = tree.getNodeByID(ROOT_DOC_KEY);
  // root.data.set("name", "root");
  // root.data.set("item_type", "folder");

  // let folder1 = root.createNode();
  // folder1.data.set("name", "folder1");
  // folder1.data.set("item_type", "folder");

  // let folder2 = root.createNode();
  // folder2.data.set("name", "folder2");
  // folder2.data.set("item_type", "folder");

  // let file_1 = folder1.createNode();

  // file_1.data.set("name", "README.md");
  // file_1.data.set("item_type", "file");

  // let file_2 = folder2.createNode();

  // file_2.data.set("name", "gleam.toml");
  // file_2.data.set("item_type", "file");
  const autoSaver = new AutoSaver(room_id, doc);
  // Call
  doc.subscribe((e) => {
    let json = JSON.stringify(tree.toArray()[0]);
    on_tree(json);

    let snapshot = doc.export({ mode: "snapshot" });
    save_loro_doc(room_id, snapshot);

    autoSaver.markChanged();
  });
  autoSaver.startAutoSave();

  let json = JSON.stringify(tree.toArray()[0]);
  on_tree(json);

  await save_function(room_id, doc);
}

interface File {
  id: string; // room_id will be used as the primary key
  content: Uint8Array;
}

export async function create_loro_doc(room_id: string) {
  const db = new Dexie(room_id) as Dexie & {
    files: EntityTable<File, "id">;
  };

  // Schema declaration:
  db.version(1).stores({
    files: "id, content", // id is the primary key (room_id)
  });

  try {
    // Try to get existing document from Dexie using room_id
    const existingFile = await db.files.get(room_id);

    let doc: LoroDoc;
    if (existingFile && existingFile.content) {
      // const binaryString = atob(existingFile.content);
      // const snapshot = new Uint8Array(binaryString.length);
      // for (let i = 0; i < binaryString.length; i++) {
      //   snapshot[i] = binaryString.charCodeAt(i);
      // }

      doc = LoroDoc.fromSnapshot(existingFile.content);
      // doc.setRecordTimestamp(true);
      return doc;
    } else {
      // Create new document with default content (a tree with a root document that dosen't have any children)
      let updateString =
        "bG9ybwAAAAAAAAAAAAAAALMgzjMAA9AAAABMT1JPAAHX7+veweqbzsQBBAACAHZ2Adfv697B6pvOxAEGAAwAxJxvVBva99cAAAAAAAMAAwEQAdf32htUb5zEAQEAAAAAAAUBAAABAAsCBAEDAAQEAAAAABQEbmFtZQlpdGVtX3R5cGUEdHJlZQkBAgIBAAMBAYAUAQQEBQACAAQEAAECBAEQBAsCBgEAEgAAAAEFBHJvb3QFBmZvbGRlcgAADAAdAAMAsImQGgEAAAAFAAAAAgBmcgAMAMScb1Qb2vfXAAAAADIPFQStAAAAogAAAExPUk8ABCJNGGBAgmIAAADxKwACAQAEdHJlZQQCCWl0ZW1fdHlwZQQGZm9sZGVyBG5hbWUEBHJvb3QAAdf32htUb5zEAAIAAQAGAIM2ACYDARkAQAQCAgFPABIFBwAFBgAgCQEZALADAQGAAAAANgACAAAAAACmP6p3AQAAAAUAAAANAADX99obVG+cxAAAAAABBgCDBHRyZWWhk7SsegAAAAAAAAA=";

      const binaryString = atob(updateString);
      const snapshot = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        snapshot[i] = binaryString.charCodeAt(i);
      }

      doc = LoroDoc.fromSnapshot(snapshot);
      // doc.setRecordTimestamp(true);
      // Save the initial document to Dexie with room_id as the key
      await db.files.put({
        id: room_id,
        content: snapshot,
      });

      return doc;
    }
  } catch (error) {
    console.error("Error accessing Dexie database:", error);
    throw error;
  }
}

// Helper function to save document updates to Dexie
export async function save_loro_doc(room_id: string, snapshot: Uint8Array) {
  const db = new Dexie(room_id) as Dexie & {
    files: EntityTable<File, "id">;
  };

  db.version(1).stores({
    files: "id, content", // id is the primary key (room_id)
  });

  try {
    // const base64String = btoa(String.fromCharCode(...snapshot));

    // Update or create the file with room_id as the key
    await db.files.put({
      id: room_id,
      content: snapshot,
    });
  } catch (error) {
    console.error("Error saving to Dexie database:", error);
    throw error;
  }
}
export function change_draft_state(
  doc: LoroDoc,
  item_id: TreeID,
  draft: Boolean
) {
  let tree: LoroTree = doc.getTree("tree");

  let note = tree.getNodeByID(item_id);
  note!.data.set("draft", draft);
}
export function create_new_note(doc: LoroDoc, item_id: TreeID) {
  let tree: LoroTree = doc.getTree("tree");

  try {
    let note = tree.createNode(item_id);
    note.data.set("item_type", "file");
    note.data.set("draft", true);
    // note.data.set("name", "Untitled");

    doc.commit();
  } catch (error) {
    console.log("Delete failed", error);
  }
}

export function create_new_folder(doc: LoroDoc, item_id: TreeID) {
  let tree: LoroTree = doc.getTree("tree");

  try {
    let folder = tree.createNode(item_id);
    folder.data.set("item_type", "folder");
    doc.commit();
  } catch (error) {
    console.log("Delete failed", error);
  }
}

export function move_item(
  doc: LoroDoc,
  item_id: TreeID,
  drop_target_id: TreeID
) {
  let tree: LoroTree = doc.getTree("tree");

  try {
    tree.move(item_id, drop_target_id);

    doc.commit();
  } catch (error) {
    console.log("Move failed", error);
  }
}

export function delete_item(doc: LoroDoc, item_id: TreeID) {
  let tree: LoroTree = doc.getTree("tree");

  try {
    tree.delete(item_id);

    doc.commit();
  } catch (error) {
    console.log("Delete failed", error);
  }
}

export function change_item_name(
  doc: LoroDoc,
  item_id: TreeID,
  item_name: String,
  item_name_changed: () => void
) {
  let tree: LoroTree = doc.getTree("tree");

  try {
    let item_node = tree.getNodeByID(item_id);

    if (item_node) {
      item_node.data.set("name", item_name);

      doc.commit();

      item_name_changed();
    } else {
      throw console.error();
    }
  } catch (error) {
    item_name_changed();
    console.log("Delete failed", error);
  }
}
