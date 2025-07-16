// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import markdoc from "@astrojs/markdoc";
import starlightViewModes from "starlight-view-modes";
import { remarkMark } from "remark-mark-highlight";
import starlightAutoSidebar from "starlight-auto-sidebar";
import starlightThemeRapide from "starlight-theme-rapide";
import starlightThemeObsidian from "starlight-theme-obsidian";
import starlightObsidian, { obsidianSidebarGroup } from "starlight-obsidian";

// https://astro.build/config
export default defineConfig({
  // markdown: {
  //   remarkPlugins: [remarkMark],
  // },
  site: "https://sanabel-al-firdaws.github.io",
  integrations: [
    markdoc({ allowHTML: true }),
    starlight({
      tableOfContents: {
        minHeadingLevel: 1,
        maxHeadingLevel: 6,
      },
      plugins: [
        starlightThemeObsidian({
          graph: false,
          backlinks: false,
        }),
        starlightObsidian({
          copyFrontmatter: "starlight",
          tableOfContentsOverview: "title",
          output: "",
          vault: "./vault",
        }),
      ],
      customCss: ["./src/styles/starlight.css"],
      title: "سنابل الفردوس",
      locales: {
        root: {
          dir: "rtl",
          label: "Arabic",
          lang: "ar", // lang is required for root locales
        },
      },
      // sidebar: [obsidianSidebarGroup],
      // components: {
      //   PageTitle: "./src/components/PageTitle.astro",
      //   SocialIcons: "./src/components/SocialIcons.astro",
      //   TableOfContents: "./src/components/TableOfContents.astro",
      // },
      // social: [
      //   {
      //     icon: "github",
      //     label: "GitHub",
      //     href: "https://github.com/withastro/starlight",
      //   },
      // ],
    }),
  ],
});
