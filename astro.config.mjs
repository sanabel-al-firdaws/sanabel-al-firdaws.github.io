// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import markdoc from "@astrojs/markdoc";
import wasm from "vite-plugin-wasm";
import gleam from "vite-gleam";
import toplevelawait from "vite-plugin-top-level-await";
// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [gleam(), wasm(), toplevelawait()],
  },
  integrations: [
    markdoc(),
    starlight({
      title: "My Docs",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/withastro/starlight",
        },
      ],
      // sidebar: [
      // 	{
      // 		label: 'Guides',
      // 		items: [
      // 			// Each item here is one entry in the navigation menu.
      // 			{ label: 'Example Guide', slug: 'guides/example' },
      // 		],
      // 	},
      // 	{
      // 		label: 'Reference',
      // 		autogenerate: { directory: 'reference' },
      // 	},
      // ],
    }),
  ],
});
