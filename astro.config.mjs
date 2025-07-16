// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import markdoc from "@astrojs/markdoc";
import wasm from "vite-plugin-wasm";
import gleam from "vite-gleam";
import starlightViewModes from "starlight-view-modes";
import { remarkMark } from "remark-mark-highlight";
import starlightAutoSidebar from "starlight-auto-sidebar";
import starlightThemeRapide from "starlight-theme-rapide";
import starlightThemeObsidian from "starlight-theme-obsidian";
// https://astro.build/config
export default defineConfig({
  vite: {
    build: {
      target: "esnext", // This enables top-level await support
    },
    plugins: [gleam(), wasm()],
  },
  // markdown: {
  //   remarkPlugins: [remarkMark],
  // },
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
      ],
      customCss: [
        "@fontsource/scheherazade-new",
        "@fontsource/scheherazade-new/400.css",
        "@fontsource/scheherazade-new/500.css",
        "@fontsource/scheherazade-new/600.css",
        "@fontsource/scheherazade-new/700.css",
        // "@fontsource/scheherazade-new/arabic.css",
        "./src/styles/starlight.css",
      ],
      title: "سَنَابِلُ الْفِرْدَوْسِ",
      locales: {
        root: {
          dir: "rtl",
          label: "Arabic",
          lang: "ar", // lang is required for root locales
        },
      },
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
