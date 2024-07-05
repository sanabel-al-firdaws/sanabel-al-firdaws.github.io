import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import AstroPWA from "@vite-pwa/astro";
import type { ManifestOptions } from "vite-plugin-pwa";
import manifest from "./webmanifest.json";
import starlightBlog from 'starlight-blog';
import starlightViewModes from "starlight-view-modes";
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

// https://astro.build/config
export default defineConfig({
      markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeAutolinkHeadings,
        {
          // Wrap the heading text in a link.
          behavior: 'wrap',
        },
      ],
    ],
  },
  site: 'https://sanabel-al-firdaws.github.io',
  integrations: [
    starlight({
    plugins: [    starlightViewModes({
                    // Configuration options go here.
                }),
              starlightBlog({
      title: "سنابل",
      postCount: 10,
      authors: {
    hakkem: {
      name: 'عبدالحكيم الشنقيطي',
      title: 'طالب علم',
      picture: '/profile.png', // Images in the `public` directory are supported.
      url: 'https://github.com/sanabel-al-firdaws',
    },
  },
    }),],
    tableOfContents: {
      minHeadingLevel: 1,
      maxHeadingLevel: 6
    },
    customCss: [
    // Relative path to your custom CSS file
    './src/styles/custom.css',
    './src/fonts/font-face.css'
  ],
    components: {
      // Override the default `SocialIcons` component.
      ThemeProvider: './src/components/starlight/ThemeProvider.astro',
      // EditLink: './src/components/starlight/EditLink.astro',
      ThemeSelect: './src/components/blog-override/ThemeSelect.astro',
      SocialIcons:'./src/components/starlight/SocialIcons.astro',
      Pagination: './src/components/starlight/Pagination.astro',
      Search: './src/components/starlight/Search.astro',
      MarkdownContent: './src/components/starlight/MarkdownContent.astro'
    },
    title: 'سنابل الفردوس',
    lastUpdated: true,
    description: 'المنهج السلفي بأسلوب سلس ومبسط',
    titleDelimiter: '🌾',
    defaultLocale: 'ar',
    locales: {
      root: {
        label: "العربية",
        lang: "ar",
        dir: 'rtl'
      },

    },
    editLink: {
      baseUrl: 'https://github.com/sanabel-al-firdaws/sanabel-al-firdaws.github.io/edit/main/'
    },
    social: {
      github: 'https://github.com/sanabel-al-firdaws/sanabel-al-firdaws.github.io/',
    },
    sidebar: [{
      
      label: 'اللغة العربية',
    
      collapsed: true,
      autogenerate: {
          directory: 'arabic'
        }
      
    },
    {
      label: 'العقيدة',

      collapsed: true,
      autogenerate: {
          directory: 'aqida'
        }
    },

    
    
    ]
  })
  , AstroPWA({
    mode: "production", ///production
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico"],
    workbox: {
        globPatterns: ["**/*"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        sourcemap: true
        
      },

      experimental: {
        directoryAndTrailingSlashHandler: true,
      },
    
    manifest: (manifest as Partial<ManifestOptions>)
    })]
});
