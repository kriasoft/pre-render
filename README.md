# [Pre-render](https://www.npmjs.com/package/pre-render)

It's often easier to create a normal single-page web application ([SPA][spa]) than an isomorphic
app (using server-side rendering technique or SSR) by using [React][react], [Vue.js][vue] etc (see
[example][rsb]). But what about SEO, initial page load time, and other optimizations?

The goal of this project is to alow you generate static `.html` pages for your single-page app.
You just build your project as normal, assuming that it compiles into the `/build` (or `/dist`)
folder, then prepare the list of relative URL paths that need to be pre-rendred and pass that info
to **`pre-render`**, it will load `/build/index.html` in a headless Chrome browser, iterate over
the list of provided URL path strings and save each page to a corresponding `.html` file.

### How to Use

You need to tweak your app, to expose `window.prerender` handler, that may look something like this:

```js
window.preprender = (path) => new Promise(resolve => {
  history.push(path);
  /* make sure that the client-side rendering is complete, then */
  resolve(document.documentElement.outerHTML);
});
```

Then build your project (`npm run build`) and run the following script:

```js
const prerender = require('pre-render');

prerender('./build', [
  '/',
  '/about',
  /* ... */
]);
```

Now, you can deploy the contents of the `/build` folder to GitHub Pages, Firebase, or some other CDN
hosting, yet making sure that the search engines will be able to crawl your site.

### License

Copyright © 2017-present Kriasoft. This source code is licensed under the MIT license found in the
[LICENSE.txt](https://github.com/kriasoft/pre-render/blob/master/LICENSE.txt) file.

---
Made with ♥ by Konstantin Tarkus ([@koistya](https://twitter.com/koistya), [blog](https://medium.com/@tarkus)) and [contributors](https://github.com/kriasoft/pre-render/graphs/contributors)

[spa]: https://en.wikipedia.org/wiki/Single-page_application
[react]: https://facebook.github.io/react/
[vue]: https://vuejs.org/
[rsb]: https://github.com/kriasoft/react-static-boilerplate
