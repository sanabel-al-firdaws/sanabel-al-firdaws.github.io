import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkCustomHeaderId from 'remark-custom-header-id';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import AstroPWA from "@vite-pwa/astro";
import type { ManifestOptions } from "vite-plugin-pwa";
import manifest from "./webmanifest.json";
// import font from "TNB.ttf";

import starlightBlog from 'starlight-blog';
import starlightViewModes from "starlight-view-modes";
import { remarkMark } from 'remark-mark-highlight';
// import starlightImageZoom from 'starlight-image-zoom';
import starlightUtils from "@lorenzo_lewis/starlight-utils";
import d2 from "astro-d2";


// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkCustomHeaderId, remarkMark],
    rehypePlugins: [[rehypeAutolinkHeadings, {
      // Wrap the heading text in a link.
      behavior: 'wrap',
      properties: {
        className: ['section_heading']
      }
    }]]
  },
  site: 'https://sanabel-al-firdaws.github.io',
  integrations: [starlight({
    plugins: [
    // starlightImageZoom({
    //   // Configuration options go here.
    //   showCaptions: false
    // }),
    starlightViewModes({
      // Configuration options go here.
    }), starlightUtils({
      multiSidebar: {
        switcherStyle: 'horizontalList'
      }
    }), starlightBlog({
      title: "الْمُدَوَّنَةُ",
      postCount: 10,
      authors: {
        hakkem: {
          name: 'عبدالحكيم الشنقيطي',
          title: 'طالب علم',
          picture: '/maskable-icon-512x512.png',
          // Images in the `public` directory are supported.
          url: 'https://github.com/sanabel-al-firdaws'
        }
      }
    })],
    tableOfContents: {
      minHeadingLevel: 1,
      maxHeadingLevel: 6
    },
    customCss: ['./src/styles/custom.css', './src/fonts/font-face.css'
    // Relative path to your custom CSS file
    // '@fontsource/scheherazade-new/400.css',
    // '@fontsource/scheherazade-new/500.css',
    // '@fontsource/scheherazade-new/600.css',
    // '@fontsource/scheherazade-new/700.css',
    ],
    components: {
      // Override the default `SocialIcons` component.
      ThemeProvider: './src/components/starlight/ThemeProvider.astro',
      // EditLink: './src/components/starlight/EditLink.astro',
      ThemeSelect: './src/components/blog-override/ThemeSelect.astro',
      SocialIcons: './src/components/starlight/SocialIcons.astro',
      Pagination: './src/components/starlight/Pagination.astro',
      Search: './src/components/starlight/Search.astro',
      Sidebar: './src/components/starlight/Sidebar.astro'
    },
    title: 'سَنَابِلُ الْفِرْدَوْسِ',
    // logo: {
    //   src: './src/assets/my-logo.svg',
    // replacesTitle: true,
    //  },
    credits: true,
    lastUpdated: true,
    description: 'المنهج السلفي بأسلوب سلس ومبسط',
    // titleDelimiter: '',
    defaultLocale: 'ar',
    locales: {
      root: {
        label: "العربية",
        lang: "ar",
        dir: 'rtl'
      }
    },
    editLink: {
      baseUrl: 'https://github.com/sanabel-al-firdaws/sanabel-al-firdaws.github.io/edit/main/'
    },
    social: {
      youtube: 'https://www.youtube.com/@سنابل-الفردوس',
      telegram: 'https://t.me/abdullhakim_alshanqiti',
      github: 'https://github.com/sanabel-al-firdaws/sanabel-al-firdaws.github.io/'
    },
    sidebar: [{
      label: 'شُرُوحُ الْكُتُبِ',
      collapsed: true,
      items: [{
        label: 'اللُّغَةُ الْعَرَبِيَّةُ',
        collapsed: true,
        autogenerate: {
          directory: 'arabic'
        }
      }, {
        label: 'الْقُرْآنُ الْكَرِيمُ',
        collapsed: true,
        autogenerate: {
          directory: 'quran'
        }
      }, {
        label: 'الْعَقِيدَةُ',
        collapsed: true,
        autogenerate: {
          directory: 'aqida'
        }
      }, {
        label: 'الرَّقَائِقُ وَالْآدَابُ',
        collapsed: true,
        autogenerate: {
          directory: 'raqaiq'
        }
      }]
    }, {
      label: 'الْمُدَوَّنَةُ',
      collapsed: true,
      items: [{
        label: 'كُلُّ الْمَقَالَاتِ',
        link: '/blog'
      }, {
        label: 'أَحْدَثُ الْمَقَالَاتِ',
        collapsed: true,
        autogenerate: {
          directory: 'blog'     
          }
      }, {
        label: 'الْأَقْسَامُ',
        collapsed: true,
        items: [{
          label: 'شُبُهَاتُ الْخَوَارِجِ',
          link: 'blog/tags/شبهات_الخوارج'
        }]
      }]
    }]
  })
  , AstroPWA({
    devOptions: {
      enabled: true,
      type: 'module',
    },
    
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      navigateFallback: "/offline",
      navigateFallbackAllowlist: [/(^\/\?highlight=.*$|^\/$|^\/.*\?ts=.*$)/],
      globPatterns: ['**/*.{html,js,css,svg,json,ttf,pf_fragment,pf_index,pf_meta,pagefind,wasm}'],
    //   runtimeCaching: [
    //     {
    //       urlPattern: /.*/i ,
    //       handler: 'NetworkFirst',
    //       options: {
    //           cacheName: 'global-cache',
    //           expiration:  {
    //           maxAgeSeconds: 60 * 60 * 24 * 365 ,
    //         },
    //         cacheableResponse: {
    //           statuses: [0,200]
    //         },
    //         networkTimeoutSeconds: 10,
    //       },
    //   },
    // ]
    },
    // useCredentials: true,

     experimental: {
      directoryAndTrailingSlashHandler: true,
    },
    mode: "production",
    registerType: 'autoUpdate',
    injectRegister: null ,
      // injectManifest: {
    //   globPatterns: ['**/*.{js,css,svg,json}'],
    //   // injectionPoint: undefined
    // },
  // strategies: 'injectManifest',
  // srcDir: 'src',
  // filename: 'pwa.ts',
    manifest: (manifest as Partial<ManifestOptions>)
  }),
  
  d2({
    sketch: true,
    layout: 'dagre',
    theme: {
      dark: false,
      default: '200'
    }
    //  fonts: { regular: './TNB.ttf',  italic: './TNB.ttf',bold: './TNB.ttf'},
  }
)



]
});



// , AstroPWA({
//   mode: "development",
//   // injectRegister: 'script',
//   // injectRegister: null,
//   workbox: {
//     // cleanupOutdatedCaches: false,
//     globPatterns: ['**/*.{js,css,png,svg,ico,ttf}'],
//     //  navigateFallback: undefined,
//     // clientsClaim: true,
//     // skipWaiting: true,
//     runtimeCaching: [
//       {
//         urlPattern: ({ request }) => request.mode === 'navigate',
//         handler: 'NetworkFirst',
//         options: {
//           cacheName: 'global-cache'
//         }
//       }

//     ]
//     //   {



//   },
//   registerType: 'autoUpdate',
// //  injectRegister: 'script',
// //   strategies: 'injectManifest',
// //   srcDir: 'src',
// //   filename: 'pwa.ts',
//   experimental: {
//     directoryAndTrailingSlashHandler: true
//   },
  
//   // devOptions: {
//   //   enabled: true
//   //   /* other options */
//   // },
//   manifest: (manifest as Partial<ManifestOptions>)
// }),