import { defineMarkdocConfig, component } from "@astrojs/markdoc/config";
import starlightMarkdoc from "@astrojs/starlight-markdoc";

// https://docs.astro.build/en/guides/integrations-guide/markdoc/
export default defineMarkdocConfig({
  extends: [starlightMarkdoc()],
  tags: {
    quote: {
      render: component("./src/components/Quote.astro"),
      attributes: {
        // Markdoc requires type defs for each attribute.
        // These should mirror the `Props` type of the component
        // you are rendering.
        // See Markdoc's documentation on defining attributes
        // https://markdoc.dev/docs/attributes#defining-attributes
        link: { type: String },
        source: { type: String },
      },
    },
  },
});
