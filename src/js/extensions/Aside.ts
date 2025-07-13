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
        default: null,
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
      let type = node.attrs.type;
      let title = node.attrs.title;

      const dom = document.createElement("div");
      dom.className = "aside-view " + type;

      const label = document.createElement("label");

      // Set the label text - use custom title if available, otherwise use default
      if (title) {
        label.innerHTML = title;
      } else if (type === "note") {
        label.innerHTML = "ملاحظة";
      } else if (type === "caution") {
        label.innerHTML = "انتبه";
      } else if (type === "danger") {
        label.innerHTML = "احذر";
      }

      label.contentEditable = "false";
      label.style.cursor = "pointer";

      // Add click handler for editing title
      label.addEventListener("click", () => {
        const currentTitle = node.attrs.title || label.innerHTML;
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
            console.log(editor.getJSON());
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

          // Update the label text if title attribute changed
          const newTitle = updatedNode.attrs.title;
          const newType = updatedNode.attrs.type;

          if (newTitle) {
            label.innerHTML = newTitle;
          } else if (newType === "note") {
            label.innerHTML = "ملاحظة";
          } else if (newType === "caution") {
            label.innerHTML = "انتبه";
          } else if (newType === "danger") {
            label.innerHTML = "احذر";
          }

          // Update the node reference
          node = updatedNode;
          return true;
        },
      };
    };
  },
});
