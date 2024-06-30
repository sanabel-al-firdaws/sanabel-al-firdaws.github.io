import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import markdoc from "@astrojs/markdoc";
import AstroPWA from "@vite-pwa/astro";
import type { ManifestOptions } from "vite-plugin-pwa";



import lit from "@astrojs/lit";

// https://astro.build/config
export default defineConfig({
    
  site: 'https://sanabel-al-firdaws.github.io',
  // base: '/<project-name>',
  integrations: [AstroPWA({
    mode: "production",
    registerType: "autoUpdate",
    includeAssets: ["favicon.svg"],
    workbox: {
      navigateFallback: "/404",
      globPatterns: ["**/*.{css,js,html,svg,png,ico,txt,json}"]
      // runtimeCaching:  Cache quran Api responses
    },
    experimental: {
      directoryAndTrailingSlashHandler: true
    },
    manifest: false
  }), starlight({
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
      ThemeSelect: './src/components/starlight/ThemeSelect.astro',
      SocialIcons:'./src/components/starlight/SocialIcons.astro',
      Pagination: './src/components/starlight/Pagination.astro',
    },
    title: 'سنابل الفردوس',
    description: 'موقع يهتم بنشر العلم النافع',
    // titleDelimiter: '-',
    defaultLocale: 'ar',
    locales: {
      ar: {
        label: "العربية",
        lang: "ar",
        dir: 'rtl'
      },
      en: {
        label: "English",
        lang: "en",
        dir: 'ltr'
      }
    },
    editLink: {
      baseUrl: 'https://github.com/sanabel-al-firdaws/sanabel-al-firdaws.github.io/edit/main/'
    },
    social: {
      github: 'https://github.com/sanabel-al-firdaws/sanabel-al-firdaws.github.io/',
    },
    sidebar: [{
      
      label: 'كتاب اللغة العربية',
      translations: {
        'en': 'The Book of Arabic'
      },
      collapsed: true,
      items: [{
        collapsed: true,
        label: 'مقدمة كتاب اللغة العربية',
        translations: {
          'en': 'the intro for Arabic book'
        },
        link: '/arabic/intro/'
      }, {
        collapsed: true,
        label: 'الآجرومية',
        translations: {
          'en': 'The Ajoromia'
        },
        autogenerate: {
          directory: 'arabic/al-ajoromia'
        }
      }, {
        collapsed: true,
        label: 'ألفية ابن مالك',
        translations: {
          'en': 'The Alfiyya of Ibn Malik'
        },
        autogenerate: {
          directory: 'arabic/al-alfiyya'
        }
      }, {
        collapsed: true,
        label: 'الصرف الصغير',
        translations: {
          'en': 'the tiny sarf'
        },
        autogenerate: {
          directory: 'arabic/al-sarf'
        }
      }]
    },
    {
      label: 'كتاب العقيدة',
      translations: {
        'en': 'The Book Of Aqida'
      },
      collapsed: true,
      items: [{
        collapsed: true,
        label: 'مقدمة كتاب العقيدة',
        translations: {
          'en': 'Intro for the book of Aqida'
        },
        link: '/aqida/intro/'
      }, {
        collapsed: true,
        label: 'باب الإسلام',
        translations: {
          'en': 'Islam Chapter'
        },
        autogenerate: {
          directory: 'aqida/al-islam'
        }
      }, {
        collapsed: true,
        label: 'باب الإيمان',
        translations: {
          'en': 'Eman Chapter'
        },
        autogenerate: {
          directory: 'aqida/al-eman'
        }
      }, {
        collapsed: true,
        label: 'باب الإحسان',
        translations: {
          'en': 'Ehsan Chapter'
        },
        autogenerate: {
          directory: 'aqida/al-ehsan'
        }
      }]
    },
    {

    label: 'درر وفوائد منوعة',
    translations: {
      'en': 'dorrar and benefits'
    },
    autogenerate: {
      directory: 'dorrar'
    },
    collapsed: true,
    items: [ {
      collapsed: true,
      label: 'مدونة كشف الشبهات',
      translations: {
        'en': 'Kshf Al Shoboha'
      },
      autogenerate: {
        directory: 'dorrar/kshf-al-shobohat'
      }
    },
    {
      collapsed: true,
      label: 'مقالات منوعة',
      translations: {
        'en': 'Uniqe Articles'
      },
      autogenerate: {
        directory: 'dorrar/articles'
      }
    },
    ]
  },// kshf-al-shobohat
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
  }), markdoc(), lit()]
});
