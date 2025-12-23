/**
 * validator.js - Common validation functions
 */

/**
 * Extract Notion page ID from URL or return as-is if already a valid ID
 * @param {string} input - Notion page URL or page ID
 * @returns {string|null} Extracted page ID or null if invalid
 */
export function extractPageId(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Check if it's already a valid 32-character hex ID (without dashes)
  if (/^[a-f0-9]{32}$/i.test(trimmed)) {
    return trimmed;
  }

  // Check if it's a valid UUID format (with dashes)
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(trimmed)) {
    return trimmed.replace(/-/g, '');
  }

  // Try to extract from Notion URL
  // Format: https://www.notion.so/workspace/Page-Title-xxxxx...xxxxx
  // Or: https://www.notion.so/Page-Title-xxxxx...xxxxx
  // Or: https://notion.so/xxxxx...xxxxx
  const urlMatch = trimmed.match(/notion\.so\/(?:[^/]+\/)?(?:[^-]+-)*([a-f0-9]{32})/i);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Try to extract the last 32 hex characters from URL
  const lastHexMatch = trimmed.match(/([a-f0-9]{32})(?:\?|$)/i);
  if (lastHexMatch) {
    return lastHexMatch[1];
  }

  return null;
}

/**
 * Validate Notion API key format
 * @param {string} apiKey - Notion API key
 * @returns {boolean} True if format is valid
 */
export function isValidApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  // Notion internal integration tokens start with "secret_" or "ntn_"
  return /^(secret_|ntn_)[a-zA-Z0-9]+$/.test(apiKey.trim());
}

/**
 * Validate markdown content
 * @param {string} markdown - Markdown content
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {{valid: boolean, error?: string}}
 */
export function validateMarkdown(markdown, maxSize = 10 * 1024 * 1024) {
  if (!markdown || typeof markdown !== 'string') {
    return { valid: false, error: 'Markdown content is required' };
  }

  const trimmed = markdown.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Markdown content cannot be empty' };
  }

  const byteSize = Buffer.byteLength(trimmed, 'utf8');
  if (byteSize > maxSize) {
    return { 
      valid: false, 
      error: `Content size (${(byteSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / 1024 / 1024).toFixed(2)}MB)` 
    };
  }

  return { valid: true };
}

/**
 * Get markdown statistics
 * @param {string} markdown - Markdown content
 * @returns {{chars: number, lines: number, words: number}}
 */
export function getMarkdownStats(markdown) {
  if (!markdown) {
    return { chars: 0, lines: 0, words: 0 };
  }

  return {
    chars: markdown.length,
    lines: markdown.split('\n').length,
    words: markdown.trim().split(/\s+/).filter(w => w.length > 0).length
  };
}

