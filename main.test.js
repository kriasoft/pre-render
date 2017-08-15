/**
 * Pre-render (https://github.com/kriasoft/pre-render)
 *
 * Copyright © 2017-present Kriasoft. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

const fs = require('fs');
const chai = require('chai');
const rimraf = require('rimraf');
const render = require('./');

const expect = chai.expect;
const tmp = `./test_${Date.now()}`;

chai.use(require('chai-as-promised'));

beforeEach(() => {
  fs.mkdirSync(tmp);
  fs.writeFileSync(
    `${tmp}/index.html`,
    `<script src="/main.js"></script><div id="root"></div>`,
    'utf8'
  );
  fs.writeFileSync(
    `${tmp}/main.js`,
    `window.prerender = (path) => new Promise((resolve, reject) => {
      if (path === '/') {
        document.getElementById('root').innerHTML = '<h1>Home</h1>';
        resolve(document.documentElement.outerHTML);
      } else if (path === '/about') {
        document.getElementById('root').innerHTML = '<h1>About</h1>';
        resolve(document.documentElement.outerHTML);
      } else {
        reject();
      }
    });`,
    'utf8'
  );
});

afterEach(() => {
  rimraf.sync(tmp);
});

it('Ensure that the "path" argument is provided.', () => {
  const result = render();
  expect(result).to.be.a('promise');
  expect(result).to.be.rejectedWith('Must provide a path string.');
});

it('Foo', async function test() {
  this.timeout(5000);
  await render(tmp, ['/', '/about']);
  const file1 = fs.readFileSync(`${tmp}/index.html`, 'utf8');
  const file2 = fs.readFileSync(`${tmp}/about/index.html`, 'utf8');
  expect(file1).to.be.equal(
    '<html><head><script src="/main.js"></script></head><body><div id="root"><h1>Home</h1></div></body></html>'
  );
  expect(file2).to.be.equal(
    '<html><head><script src="/main.js"></script></head><body><div id="root"><h1>About</h1></div></body></html>'
  );
});
