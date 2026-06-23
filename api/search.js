/**
 * StreamLify Search Scraper API (Node.js/Vercel Serverless)
 * Author: Hidz
 */

import { URL } from 'url';

// Helper to decode HTML entities safely without heavy libraries
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get 'q' parameter from query
  let query = req.query.q;

  // Fallback check: if requested via friendly route, extract query from URL path
  if (!query) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathParts = parsedUrl.pathname.split('/');
    // If route is /api/search/sth or /search/sth
    const searchIdx = pathParts.indexOf('search');
    if (searchIdx !== -1 && pathParts[searchIdx + 1]) {
      query = decodeURIComponent(pathParts[searchIdx + 1]);
    }
  }

  if (!query || !query.trim()) {
    return res.status(400).json({
      status: false,
      message: "Mau nyari apa bos? Isi parameter 'q' dulu! 🗿"
    });
  }

  const cleanQuery = query.trim();
  const encodedQuery = encodeURIComponent(cleanQuery).replace(/%20/g, '+');
  const page = parseInt(req.query.page) || 1;
  const searchUrl = page > 1 ? `https://www.xnxx.com/search/${encodedQuery}/${page}` : `https://www.xnxx.com/search/${encodedQuery}`;

  try {
    // Fetch target website with bypass headers
    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        "Cookie": "sex_verified=1; adblck=0; allowed_cookie=1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Target responded with status: ${response.status}`);
    }

    const searchHtml = await response.text();

    if (!searchHtml) {
      return res.status(500).json({
        status: false,
        message: "Gagal terhubung ke server target."
      });
    }

    // Parse blocks using custom block splitting (matching the PHP structure)
    const videoBlocks = searchHtml.split('class="thumb-block');
    videoBlocks.shift(); // Remove content before first video class="thumb-block"

    const results = [];

    for (const block of videoBlocks) {
      // 1. Extract Page URL & Video Title
      const urlTitleMatch = block.match(/href="(\/video-[a-z0-9]+\/[^"]+)"\s+title="([^"]+)"/i);
      
      // 2. Extract Thumbnail
      const thumbMatch = block.match(/(?:data-src|src)="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) || block.match(/<img[^>]+(?:data-src|src)="([^"]+)"/i);
      
      // 3. Extract Duration
      const durationMatch = block.match(/<span class="duration">([^<]+)<\/span>/i);

      if (urlTitleMatch && urlTitleMatch[1]) {
        const path = urlTitleMatch[1];
        const rawTitle = urlTitleMatch[2];
        const duration = durationMatch ? durationMatch[1].trim() : "N/A";
        let thumbnail = thumbMatch ? thumbMatch[1] : null;
        if (thumbnail && thumbnail.startsWith('//')) {
          thumbnail = 'https:' + thumbnail;
        } else if (thumbnail && thumbnail.startsWith('/')) {
          thumbnail = 'https://www.xnxx.com' + thumbnail;
        }

        results.push({
          title: decodeHtmlEntities(rawTitle),
          duration: duration,
          thumbnail: thumbnail,
          page_url: `https://www.xnxx.com${path}`
        });
      }
    }

    return res.status(200).json({
      status: true,
      search_query: cleanQuery,
      total_found: results.length,
      page: page,
      results: results
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Gagal menarik data: ${error.message}`
    });
  }
}
