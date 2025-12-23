/**
 * markdown.js - Markdown processing service
 */

import { markdownToBlocks } from '@tryfabric/martian';

class MarkdownService {
  /**
   * Convert markdown text to Notion blocks
   * @param {string} markdown - Markdown content
   * @returns {Array} Array of Notion blocks
   */
  convertToBlocks(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return [];
    }
    
    try {
      return markdownToBlocks(markdown);
    } catch (error) {
      console.error('Error converting markdown to blocks:', error);
      throw new Error(`Failed to convert markdown: ${error.message}`);
    }
  }

  /**
   * Extract title from markdown content
   * Looks for the first # or ## heading
   * @param {string} markdown - Markdown content
   * @returns {string} Extracted title or default title
   */
  extractTitle(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return 'New Markdown Page';
    }

    const lines = markdown.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      } else if (trimmed.startsWith('## ')) {
        return trimmed.substring(3).trim();
      }
    }

    // If no heading found, use first non-empty line (truncated)
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        return trimmed.length > 50 
          ? trimmed.substring(0, 50) + '...' 
          : trimmed;
      }
    }

    return 'New Markdown Page';
  }

  /**
   * Get markdown statistics
   * @param {string} markdown - Markdown content
   * @returns {Object} Statistics object
   */
  getStats(markdown) {
    if (!markdown) {
      return { chars: 0, lines: 0, words: 0, blocks: 0 };
    }

    const blocks = this.convertToBlocks(markdown);
    
    return {
      chars: markdown.length,
      lines: markdown.split('\n').length,
      words: markdown.trim().split(/\s+/).filter(w => w.length > 0).length,
      blocks: blocks.length
    };
  }
}

export const markdownService = new MarkdownService();

