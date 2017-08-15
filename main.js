/**
 * Pre-render (https://github.com/kriasoft/pre-render)
 *
 * Copyright © 2017-present Kriasoft. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint-disable no-restricted-syntax, no-await-in-loop */

const fs = require('fs');
const path = require('path');
const makeDir = require('make-dir');
const mimeTypes = require('mime-types');
const ChromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const log = require('lighthouse-logger');

async function render(src, urls = ['/']) {
  if (!src) {
    throw new Error('Must provide a path string.');
  }

  if (!urls || !Array.isArray(urls) || !urls.length) {
    throw new Error('Must provide a list of relative URLs.');
  }

  let chrome;
  let client;

  try {
    log.setLevel('info');

    // Launch a new instance of the headless Chrome browser
    // https://developers.google.com/web/updates/2017/04/headless-chrome
    chrome = await ChromeLauncher.launch({
      chromeFlags: [
        '--window-size=1366,768',
        '--disable-gpu',
        // '--disable-web-security',
        // '--user-data-dir',
        '--headless',
      ],
    });

    // Configure Chrome DevTools Protocol
    // https://github.com/cyrus-and/chrome-remote-interface
    // https://github.com/cyrus-and/chrome-remote-interface/wiki
    client = await CDP({ port: chrome.port });
    const { Page, Network, Runtime, Security } = client;

    await Network.setRequestInterceptionEnabled({ enabled: true });
    // await Security.setOverrideCertificateErrors({ override: true });

    await Promise.all([
      Page.enable(),
      Network.enable(),
      Security.enable(),
      Runtime.enable(),
    ]);

    Network.requestIntercepted(({ interceptionId, request }) => {
      // console.log(`${interceptionId} ${request.method} ${request.url}`);
      if (request.url.startsWith('http://localhost:3000/')) {
        const pathname = request.url.substr(21);
        const file =
          pathname === '/' ? `${src}/index.html` : `${src}${pathname}`;
        const response = [
          'HTTP/1.1 200 OK',
          `Content-Type: ${mimeTypes.contentType(path.extname(file))}`,
          '\r\n',
          fs.readFileSync(file, 'utf8'),
        ].join('\r\n');

        Network.continueInterceptedRequest({
          interceptionId,
          rawResponse: new Buffer(response).toString('base64'),
        });
      } else {
        Network.continueInterceptedRequest({ interceptionId });
      }
    });

    // Security.certificateError(({ eventId }) => {
    //   Security.handleCertificateError({ eventId, action: 'continue' });
    // });

    await Page.navigate({ url: 'http://localhost:3000/' });
    await Page.loadEventFired();

    // eslint-disable-next-line no-restricted-syntax, no-await-in-loop
    for (const url of urls) {
      const filename =
        url === '/' ? `${src}/index.html` : `${src}/${url}/index.html`;

      if (url !== '/') {
        await makeDir(path.dirname(filename));
      }

      const { result } = await Runtime.evaluate({
        expression: `window.prerender("${url}")`,
        awaitPromise: true,
      });

      fs.writeFileSync(filename, result.value, 'utf8');
    }
  } finally {
    if (client) client.close();
    if (chrome) chrome.kill();
  }
}

module.exports = render;
