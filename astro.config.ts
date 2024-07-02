import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import AstroPWA from "@vite-pwa/astro";
import type { ManifestOptions } from "vite-plugin-pwa";
import manifest from "./webmanifest.json";
import starlightBlog from 'starlight-blog';
import starlightViewModes from "starlight-view-modes";
// https://astro.build/config
export default defineConfig({
    
  site: 'https://sanabel-al-firdaws.github.io',
  base: "./",
  // base: '/<project-name>',
  integrations: [
    AstroPWA({
    mode: "production",
    registerType: "autoUpdate",
    incudeAssets: ["favicon.svg"],
    workbox: {
        navigateFallback: "/",
        globPatterns: ["**/*.{css,js,html,svg,png,ico,txt}"],
      },
      experimental: {
        directoryAndTrailingSlashHandler: true,
      },
    
    manifest: (manifest as Partial<ManifestOptions>)
    }), starlight({
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
      picture: 'https://avatars.githubusercontent.com/u/136203274', // Images in the `public` directory are supported.
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
    description: 'موقع يهتم بنشر العلم النافع',
    // titleDelimiter: '-',
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
      
      label: 'كتاب اللغة العربية',
    
      collapsed: true,
      items: [{
        collapsed: true,
        label: 'مقدمة كتاب اللغة العربية',
        link: '/arabic/intro/'
      }, {
        collapsed: true,
        label: 'الآجرومية',
        autogenerate: {
          directory: 'arabic/al-ajoromia'
        }
      }, {
        collapsed: true,
        label: 'ألفية ابن مالك',
      
        autogenerate: {
          directory: 'arabic/al-alfiyya'
        }
      }, {
        collapsed: true,
        label: 'الصرف الصغير',
   
        autogenerate: {
          directory: 'arabic/al-sarf'
        }
      }]
    },
    {
      label: 'كتاب العقيدة',

      collapsed: true,
      items: [{
        collapsed: true,
        label: 'مقدمة كتاب العقيدة',

        link: '/aqida/intro/'
      }, {
        collapsed: true,
        label: 'باب الإسلام',

        autogenerate: {
          directory: 'aqida/al-islam'
        }
      }, {
        collapsed: true,
        label: 'باب الإيمان',

        autogenerate: {
          directory: 'aqida/al-eman'
        }
      }, {
        collapsed: true,
        label: 'باب الإحسان',

        autogenerate: {
          directory: 'aqida/al-ehsan'
        }
      }]
    },

    
    // kshf-al-shobohat
    // {
    // 	label: 'Reference',
    // 	collapsed: true,
    // 	autogenerate: { directory: 'reference' },
    // },
    // {
    // 	label: 'Testing',
    // 	collapsed: true,
    // 	autogenerate: { directory: 'test' },
    // },
    ]
  })]
});
