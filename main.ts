/// &lt;reference types="https://deno.land/x/deno/cli/tsc/dts/lib.deno.d.ts" /&gt;
import { serve } from "https://deno.land/std@0.182.0/http/server.ts";

/**
 * Checks if a single Gemini API key is valid by sending a lightweight request.
 * @param key The API key to check.
 * @returns A promise that resolves to true if the key is valid, false otherwise.
 */
async function checkApiKey(key: string): Promise<boolean> {
  const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`;
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty body as required for a simple check
    });
    return response.status === 200;
  } catch (error) {
    console.error(`Error checking key ${key}:`, error);
    return false;
  }
}

/**
 * Main request handler for the Deno server.
 * @param req The incoming HTTP request.
 * @returns An HTTP response.
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const { method } = req;

  // Route for checking API keys
  if (method === 'POST' && pathname === '/check-keys') {
    try {
      const { apiKeys } = await req.json();

      // Validate the input
      if (!Array.isArray(apiKeys) || !apiKeys.every(k => typeof k === 'string')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid "apiKeys" field, which must be an array of strings.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Remove duplicate and empty keys to avoid redundant checks
      const uniqueKeys: string[] = [...new Set(apiKeys.filter(k => k.trim() !== ''))];

      const results = await Promise.allSettled(
        uniqueKeys.map(key => checkApiKey(key))
      );

      const validKeys: string[] = [];
      const invalidKeys: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          validKeys.push(uniqueKeys[index]);
        } else {
          invalidKeys.push(uniqueKeys[index]);
        }
      });

      return new Response(JSON.stringify({ validKeys, invalidKeys }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // --- Static File Serving ---

  // Serve index.html for the root path
  if (method === 'GET' && pathname === '/') {
    try {
      const fileContent = await Deno.readTextFile('./index.html');
      return new Response(fileContent, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }

  // Serve style.css
  if (method === 'GET' && pathname === '/style.css') {
    try {
      const fileContent = await Deno.readTextFile('./style.css');
      return new Response(fileContent, {
        status: 200,
        headers: { 'Content-Type': 'text/css; charset=utf-8' },
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }

  // Serve script.js
  if (method === 'GET' && pathname === '/script.js') {
    try {
      const fileContent = await Deno.readTextFile('./script.js');
      return new Response(fileContent, {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }

  // Fallback for any other GET request
  return new Response('Not Found', { status: 404 });

  // For other methods like PUT, DELETE, etc.
  return new Response('Method Not Allowed', { status: 405 });
}

// Start the Deno server
console.log("Server running on http://localhost:8000");
serve(handler, { port: 8000 });