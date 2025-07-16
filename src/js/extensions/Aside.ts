import { mergeAttributes, Node } from "@tiptap/core";

export default Node.create({
  name: "Aside",

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element) => element.getAttribute("type"),
        renderHTML: (attributes) => {
          if (!attributes.type) {
            return {};
          }
          return {
            type: attributes.type,
          };
        },
      },
      title: {
        // default: null,
        parseHTML: (element) => element.getAttribute("title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            title: attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "aside-view",
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ["aside-view", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.className = "aside-view " + node.attrs.type;

      const label = document.createElement("label");
      label.contentEditable = "false";
      label.style.cursor = "pointer";

      // Helper function to get the display title
      const getDisplayTitle = (nodeAttrs) => {
        if (nodeAttrs.title) {
          return nodeAttrs.title;
        }

        // Default Arabic titles
        switch (nodeAttrs.type) {
          case "note":
            return "ملاحظة";
          case "caution":
            return "انتبه";
          case "danger":
            return "احذر";
          default:
            return "ملاحظة"; // fallback
        }
      };

      // Set initial label text
      const updateLabel = (nodeAttrs) => {
        label.innerHTML = getDisplayTitle(nodeAttrs);
      };

      // Initialize label
      updateLabel(node.attrs);

      // Add click handler for editing title
      label.addEventListener("click", () => {
        const currentTitle = node.attrs.title || getDisplayTitle(node.attrs);
        const newTitle = prompt("قم بكتابة العنوان :", currentTitle);

        if (newTitle !== null && newTitle !== currentTitle) {
          // Update the node's title attribute
          const pos = getPos();
          if (pos !== undefined) {
            const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              title: newTitle,
            });
            editor.view.dispatch(tr);
          }
        }
      });

      const content = document.createElement("div");
      content.classList.add("content");
      content.classList.add("is-editable");

      dom.append(label, content);

      return {
        dom,
        contentDOM: content,
        // Update method to handle attribute changes
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) {
            return false;
          }

          // Check if title or type changed
          const titleChanged = updatedNode.attrs.title !== node.attrs.title;
          const typeChanged = updatedNode.attrs.type !== node.attrs.type;

          if (titleChanged || typeChanged) {
            updateLabel(updatedNode.attrs);
          }

          // Update the class if type changed
          if (typeChanged) {
            dom.className = "aside-view " + updatedNode.attrs.type;
          }

          // Update the node reference
          node = updatedNode;
          return true;
        },
      };
    };
  },
});
