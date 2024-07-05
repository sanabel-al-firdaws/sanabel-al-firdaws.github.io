import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import {s} from 'hastscript' 
import AstroPWA from "@vite-pwa/astro";
import type { ManifestOptions } from "vite-plugin-pwa";
import manifest from "./webmanifest.json";
import starlightBlog from 'starlight-blog';
import starlightViewModes from "starlight-view-modes";

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
        
    content: s(
      'svg.octicon.octicon-link',
      {
        viewBox: '0 0 16 16',
        version: '1.1',
        width: 16,
        height: 16,
        ariaHidden: 'true'
      },
      s('path', {
        d: 'm7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z'
      })
    ),
    headingProperties: {tabIndex: '-1', dir: 'auto'},
    properties: {className: ['heading-link']}
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
      Search: './src/components/starlight/Search.astro'
    },
    title: 'سنابل الفردوس',
    lastUpdated: true,
    description: 'المنهج السلفي بأسلوب سلس ومبسط',
   // titleDelimiter: '',
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
