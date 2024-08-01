# remark-mark-highlight

> Thanks to [`remark-gfm`](https://github.com/remarkjs/remark-gfm)

A plugin that can transform `==text==` into `<span class="mark">text</span>`.

I prefer to use this plugin in [Astro](https://astro.build) to highlight the marked text.

## Usage

> This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). In Node.js (version 12.20+, 14.14+, or 16.0+), install the plugin with npm/yarn/pnpm

```sh
npm i -D remark-mark-highlight
```

Import

```js
import { remarkMark } from 'remark-mark-highlight'
// https://astro.build/config
export default defineConfig({
  // ...
  markdown: {
    remarkPlugins: [remarkMark],
    //              ^^^^^^^^^^
  },
})
```

Add css

```css
.mark {
  background-color: rgba(255, 255, 0, 0.5);
}
```

