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
        
    content: h(
	'span',
	{ ariaHidden: 'true', class: 'anchor-icon' },
	h(
		'svg',
		{ width: 16, height: 16, viewBox: '0 0 24 24' },
		h('path', {
			fill: 'currentcolor',
			d: 'm12.11 15.39-3.88 3.88a2.52 2.52 0 0 1-3.5 0 2.47 2.47 0 0 1 0-3.5l3.88-3.88a1 1 0 0 0-1.42-1.42l-3.88 3.89a4.48 4.48 0 0 0 6.33 6.33l3.89-3.88a1 1 0 1 0-1.42-1.42Zm8.58-12.08a4.49 4.49 0 0 0-6.33 0l-3.89 3.88a1 1 0 0 0 1.42 1.42l3.88-3.88a2.52 2.52 0 0 1 3.5 0 2.47 2.47 0 0 1 0 3.5l-3.88 3.88a1 1 0 1 0 1.42 1.42l3.88-3.89a4.49 4.49 0 0 0 0-6.33ZM8.83 15.17a1 1 0 0 0 1.1.22 1 1 0 0 0 .32-.22l4.92-4.92a1 1 0 0 0-1.42-1.42l-4.92 4.92a1 1 0 0 0 0 1.42Z',
		})
	)
),
    headingProperties: {tabIndex: '-1', dir: 'rtl'},
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
