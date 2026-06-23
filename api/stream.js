/**
 * StreamLify Video Stream Extractor API (Node.js/Vercel Serverless)
 * Author: Hidz
 */

import { URL } from 'url';

// Helper to decode HTML entities safely
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

// Age bypass headers
const fetchHeaders = {
  "Cookie": "sex_verified=1; adblck=0; allowed_cookie=1",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
};

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=UTF-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let targetUrl = req.query.url;
  let titleSlug = req.query.title;

  // Fallback checks for custom route queries parsing
  if (!targetUrl && !titleSlug) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathParts = parsedUrl.pathname.split('/');
    const streamIdx = pathParts.indexOf('stream');
    if (streamIdx !== -1 && pathParts[streamIdx + 1]) {
      titleSlug = decodeURIComponent(pathParts[streamIdx + 1]);
    }
  }

  // If a title slug is supplied (e.g., hello+world), perform internal search to locate first result
  if (!targetUrl && titleSlug) {
    const searchQuery = titleSlug.replace(/\+/g, ' ');
    const encodedSearchQuery = encodeURIComponent(searchQuery).replace(/%20/g, '+');
    const searchApiUrl = `https://www.xnxx.com/search/${encodedSearchQuery}`;
    
    try {
      const searchRes = await fetch(searchApiUrl, { headers: fetchHeaders });
      if (searchRes.ok) {
        const searchHtml = await searchRes.text();
        const videoBlocks = searchHtml.split('class="thumb-block');
        if (videoBlocks.length > 1) {
          const firstBlock = videoBlocks[1];
          const urlMatch = firstBlock.match(/href="(\/video-[a-z0-9]+\/[^"]+)"/i);
          if (urlMatch && urlMatch[1]) {
            targetUrl = `https://www.xnxx.com${urlMatch[1]}`;
          }
        }
      }
    } catch (err) {
      console.error("Internal search failed:", err);
    }
  }

  if (!targetUrl) {
    return res.status(400).json({
      status: false,
      message: "URL mana yang mau ditarik link mentahnya bos? Atau masukkan title nya! 🙄"
    });
  }

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: fetchHeaders
    });

    if (!response.ok) {
      throw new Error(`Target responded with status: ${response.status}`);
    }

    const videoHtml = await response.text();

    if (!videoHtml) {
      return res.status(500).json({
        status: false,
        message: "Gagal mengekstrak halaman video target."
      });
    }

    // 1. Extract Genuine Title
    const titleMatch = videoHtml.match(/html5player\.setVideoTitle\(\s*'([^']+)'\s*\)/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Unknown Title';

    // 2. Extract Low Quality (360p) and High Quality streams
    const lowMatch = videoHtml.match(/html5player\.setVideoUrlLow\(\s*'([^']+)'\s*\)/i);
    const highMatch = videoHtml.match(/html5player\.setVideoUrlHigh\(\s*'([^']+)'\s*\)/i);

    // Fallbacks
    const downloadUrl = lowMatch ? lowMatch[1] : (highMatch ? highMatch[1] : null);
    const quality = lowMatch ? "360p" : (highMatch ? "High Quality (Fallback)" : "N/A");

    if (downloadUrl) {
      return res.status(200).json({
        status: true,
        data: {
          title: title,
          quality: quality,
          download_url: downloadUrl,
          high_quality_url: highMatch ? highMatch[1] : null,
          low_quality_url: lowMatch ? lowMatch[1] : null
        }
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Gagal mendapatkan link direct mp4."
      });
    }

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: `Gagal menarik stream video: ${error.message}`
    });
  }
}
