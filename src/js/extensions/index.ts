import Highlight from "@tiptap/extension-highlight";
import Details, {
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import Aside from "./Aside";
import Quote from "./Quote";
import TableOfContents from "@tiptap/extension-table-of-contents";
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { Octokit } from "octokit";
export let tiptapExtensions = [
  Details.configure({
    persist: false,
    HTMLAttributes: {
      class: "question",
    },
  }),
  DetailsSummary,
  DetailsContent,
  Aside,
  Quote,
  TableOfContents,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "ما هو العنوان ?";
      }
      return "ابدأ الكتابة";
    },
  }),
  Highlight.configure({ multicolor: true }),
  StarterKit.configure({
    undoRedo: false, // Disable built-in undo/redo since we're using collaboration
  }),
];

export function serializeChildrenToHTMLString(
  children?: string | string[]
): string {
  return ([] as string[])
    .concat(children || "")
    .filter(Boolean)
    .join("");
}

export let render_options = {
  nodeMapping: {
    Aside: (node) => {
      const type = node.node.attrs.type;
      let title = node.node.attrs.title;
      if (!title) {
        switch (type) {
          case "note":
            title = "ملاحظة";
          case "caution":
            title = "انتبه";
          case "danger":
            title = "احذر";
          default:
            title = "ملاحظة"; // fallback
        }
      }
      // console.log(attrs);

      // Extract the content from the node
      const children = serializeChildrenToHTMLString(node.children).trim();

      return `\n{% aside type="${type}" title="${title}" %}\n
      ${children}
    \n{% /aside %}\n`;
    },
    Quote: (node) => {
      const source = node.node.attrs.source;
      const link = node.node.attrs.link;

      const children = serializeChildrenToHTMLString(node.children).trim();

      return `\n{% quote source="${source}" link="${link}" %}\n
      ${children}
    \n{% /quote %}\n`;
    },
    orderedList({ children }) {
      return `\n${serializeChildrenToHTMLString(children)}`;
    },
    listItem({ node, children, parent }) {
      if (parent?.type.name === "bulletList") {
        return `- ${serializeChildrenToHTMLString(children).trim()}\n`;
      }
      if (parent?.type.name === "orderedList") {
        let number = parent.attrs.start || 1;

        parent.forEach((parentChild, _offset, index) => {
          if (node === parentChild) {
            number = index + 1;
          }
        });

        return `${number}. ${serializeChildrenToHTMLString(children).trim()}\n`;
      }

      return serializeChildrenToHTMLString(children);
    },
    paragraph({ children }) {
      return `\n${serializeChildrenToHTMLString(children)}\n`;
    },
    heading({ node, children }) {
      if (children.length === 0) {
        return ``;
      } else {
        const level = node.attrs.level as number;

        return `${new Array(level).fill("#").join("")} ${children}\n`;
      }
    },
    codeBlock({ node, children }) {
      return `\n\`\`\`${node.attrs.language}\n${serializeChildrenToHTMLString(
        children
      )}\n\`\`\`\n`;
    },
    blockquote({ children }) {
      return `\n${serializeChildrenToHTMLString(children)
        .trim()
        .split("\n")
        .map((a) => `> ${a}`)
        .join("\n")}`;
    },
    image({ node }) {
      return `![${node.attrs.alt}](${node.attrs.src})`;
    },
    hardBreak() {
      return "\n";
    },
    horizontalRule() {
      return "\n---\n";
    },
    table({ children, node }) {
      if (!Array.isArray(children)) {
        return `\n${serializeChildrenToHTMLString(children)}\n`;
      }

      return `\n${serializeChildrenToHTMLString(children[0])}| ${new Array(
        node.childCount - 2
      )
        .fill("---")
        .join(" | ")} |\n${serializeChildrenToHTMLString(children.slice(1))}\n`;
    },
    tableRow({ children }) {
      if (Array.isArray(children)) {
        return `| ${children.join(" | ")} |\n`;
      }
      return `${serializeChildrenToHTMLString(children)}\n`;
    },
    tableHeader({ children }) {
      return serializeChildrenToHTMLString(children).trim();
    },
    tableCell({ children }) {
      return serializeChildrenToHTMLString(children).trim();
    },
  },
  markMapping: {
    bold({ children }) {
      return `**${serializeChildrenToHTMLString(children)}**`;
    },
    italic({ children, node }) {
      let isBoldToo = false;

      // Check if the node being wrapped also has a bold mark, if so, we need to use the bold markdown syntax
      if (node?.marks.some((m) => m.type.name === "bold")) {
        isBoldToo = true;
      }

      if (isBoldToo) {
        // If the content is bold, just wrap the bold content in italic markdown syntax with another set of asterisks
        return `*${serializeChildrenToHTMLString(children)}*`;
      }

      return `_${serializeChildrenToHTMLString(children)}_`;
    },
    code({ children }) {
      return `\`${serializeChildrenToHTMLString(children)}\``;
    },
    strike({ children }) {
      return `~~${serializeChildrenToHTMLString(children)}~~`;
    },
    underline({ children }) {
      return `<u>${serializeChildrenToHTMLString(children)}</u>`;
    },
    subscript({ children }) {
      return `<sub>${serializeChildrenToHTMLString(children)}</sub>`;
    },
    superscript({ children }) {
      return `<sup>${serializeChildrenToHTMLString(children)}</sup>`;
    },
    link({ node, children }) {
      return `[${serializeChildrenToHTMLString(children)}](${node.attrs.href})`;
    },
    highlight({ node, children }) {
      return `<mark style="  color: inherit; background-color: ${
        node.marks[0].attrs.color
      };" >${serializeChildrenToHTMLString(children)}</mark>`;
    },
  },
};

export async function get_all_update_files(github_token?: any) {
  let octokit: Octokit;
  if (github_token) {
    octokit = new Octokit({ auth: github_token });
  } else {
    let github_token = localStorage.getItem("github_token");
    octokit = new Octokit({ auth: github_token });
  }

  try {
    const response = await octokit.rest.git.getTree({
      owner: "sanabel-al-firdaws",
      repo: "sanabel-al-firdaws-cms",
      tree_sha: "HEAD",
    });

    const updateFiles = response.data.tree.filter(
      (item) => item.type === "blob" && item.path?.endsWith("update.bin")
    );

    const filesWithContent = await Promise.all(
      updateFiles.map(async (file) => {
        try {
          const content = await octokit.rest.repos.getContent({
            owner: "sanabel-al-firdaws",
            repo: "sanabel-al-firdaws-cms",
            // branch: "p2p-notebook",

            path: file.path!,
          });

          if (!Array.isArray(content.data) && content.data.type === "file") {
            // Decode base64 content to Uint8Array
            const base64Content = content.data.content;

            return base64Content;
          }
        } catch (error) {
          console.error(`Failed to get content for ${file.path}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed requests
    const validFiles = filesWithContent.filter((file) => file !== null);
    return validFiles;
  } catch (error) {
    console.error(`Failed to get content for `);
    return null;
  }
}
