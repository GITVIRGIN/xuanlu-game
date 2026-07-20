import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import {
  constants as zlibConstants,
  createBrotliCompress,
  createGzip
} from 'node:zlib';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function resolveRequestPath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  return resolve(root, relativePath);
}

const compressibleExtensions = new Set(['.html', '.js', '.css', '.md', '.json', '.svg']);

function cacheControl(extension) {
  if (extension === '.html') return 'no-store';
  if (extension === '.js' || extension === '.css' || extension === '.json') return 'no-cache';
  return 'public, max-age=3600, must-revalidate';
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!match) return null;
  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;
  if (start === null && end !== null) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else {
    start ??= 0;
    end ??= size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    return { invalid: true };
  }
  return { start, end: Math.min(end, size - 1) };
}

createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD', 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }
  const filePath = resolveRequestPath(request.url || '/');
  const isInsideRoot = filePath === root || filePath.startsWith(`${root}${sep}`);
  if (!isInsideRoot || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const file = statSync(filePath);
  const extension = extname(filePath).toLowerCase();
  const etag = `W/"${file.size.toString(16)}-${Math.trunc(file.mtimeMs).toString(16)}"`;
  const commonHeaders = {
    'accept-ranges': 'bytes',
    'cache-control': cacheControl(extension),
    'content-type': mimeTypes[extension] || 'application/octet-stream',
    etag,
    'last-modified': file.mtime.toUTCString(),
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff'
  };
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304, commonHeaders);
    response.end();
    return;
  }

  const range = parseRange(request.headers.range, file.size);
  if (range?.invalid) {
    response.writeHead(416, { ...commonHeaders, 'content-range': `bytes */${file.size}` });
    response.end();
    return;
  }
  if (range) {
    const length = range.end - range.start + 1;
    response.writeHead(206, {
      ...commonHeaders,
      'content-length': length,
      'content-range': `bytes ${range.start}-${range.end}/${file.size}`
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath, { start: range.start, end: range.end }).pipe(response);
    return;
  }

  const accepts = request.headers['accept-encoding'] || '';
  const compressible = compressibleExtensions.has(extension) && file.size >= 512;
  let encoding = null;
  if (compressible && /\bbr\b/.test(accepts)) encoding = 'br';
  else if (compressible && /\bgzip\b/.test(accepts)) encoding = 'gzip';
  const headers = { ...commonHeaders };
  if (compressible) headers.vary = 'Accept-Encoding';
  if (encoding) headers['content-encoding'] = encoding;
  else headers['content-length'] = file.size;
  response.writeHead(200, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  const stream = createReadStream(filePath);
  if (encoding === 'br') {
    stream.pipe(createBrotliCompress({
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5 }
    })).pipe(response);
  } else if (encoding === 'gzip') {
    stream.pipe(createGzip({ level: 6 })).pipe(response);
  } else {
    stream.pipe(response);
  }
}).listen(port, host, () => {
  console.log(`codexgame static shell: http://${host}:${port}`);
});
