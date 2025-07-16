import { mergeAttributes, Node } from "@tiptap/core";

export default Node.create({
  name: "Quote",

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      source: {
        parseHTML: (element) => element.getAttribute("source"),
        renderHTML: (attributes) => {
          if (!attributes.source) {
            return {};
          }
          return {
            source: attributes.source,
          };
        },
      },
      link: {
        parseHTML: (element) => element.getAttribute("link"),
        renderHTML: (attributes) => {
          if (!attributes.link) {
            return {};
          }
          return {
            link: attributes.link,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "quote-view",
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return ["quote-view", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement("div");
      dom.className = "quote-view ";

      // Source label
      const sourceLabel = document.createElement("label");
      sourceLabel.contentEditable = "false";
      sourceLabel.style.cursor = "pointer";
      sourceLabel.className = "source-label";

      // Link label
      const linkLabel = document.createElement("label");
      linkLabel.contentEditable = "false";
      linkLabel.style.cursor = "pointer";
      linkLabel.className = "link-label";

      // Helper functions
      const getDisplaySource = (nodeAttrs) => {
        return nodeAttrs.source
          ? `المصدر: ${nodeAttrs.source}`
          : "اضغط لإضافة المصدر";
      };

      const getDisplayLink = (nodeAttrs) => {
        return nodeAttrs.link ? `الرابط` : "اضغط لإضافة الرابط";
      };

      // Update label functions
      const updateSourceLabel = (nodeAttrs) => {
        sourceLabel.innerHTML = getDisplaySource(nodeAttrs);
      };

      const updateLinkLabel = (nodeAttrs) => {
        linkLabel.innerHTML = getDisplayLink(nodeAttrs);
      };

      // Initialize labels
      updateSourceLabel(node.attrs);
      updateLinkLabel(node.attrs);

      // Add click handler for editing source
      sourceLabel.addEventListener("click", () => {
        const currentSource = node.attrs.source;
        const newSource = prompt("قم بكتابة المصدر:", currentSource);

        if (newSource !== null && newSource !== currentSource) {
          const pos = getPos();
          if (pos !== undefined) {
            const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              source: newSource,
            });
            editor.view.dispatch(tr);
          }
        }
      });

      // Add click handler for editing link
      linkLabel.addEventListener("click", () => {
        const currentLink = node.attrs.link;
        const newLink = prompt("قم بكتابة الرابط:", currentLink);

        if (newLink !== null && newLink !== currentLink) {
          const pos = getPos();
          if (pos !== undefined) {
            const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              link: newLink,
            });
            editor.view.dispatch(tr);
          }
        }
      });

      // Add labels to container
      dom.append(sourceLabel, linkLabel);

      const content = document.createElement("div");
      content.classList.add("content");
      content.classList.add("is-editable");

      dom.append(sourceLabel, linkLabel, content);

      return {
        dom,
        contentDOM: content,
        // Update method to handle attribute changes
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) {
            return false;
          }

          // Check if link or source changed
          const linkChanged = updatedNode.attrs.link !== node.attrs.link;
          const sourceChanged = updatedNode.attrs.source !== node.attrs.source;

          if (linkChanged) {
            updateLinkLabel(updatedNode.attrs);
          }

          if (sourceChanged) {
            updateSourceLabel(updatedNode.attrs);
            // Update the class if source changed
            dom.className = "quote-view " + (updatedNode.attrs.source || "");
          }

          // Update the node reference
          node = updatedNode;
          return true;
        },
      };
    };
  },
});
