/**
 * notion.js - Notion API service wrapper
 */

import { Client } from '@notionhq/client';
import { storage } from './storage.js';

// Maximum blocks per API call (Notion limitation)
const MAX_BLOCKS_PER_REQUEST = 100;

class NotionService {
  constructor() {
    this.client = null;
  }

  /**
   * Initialize Notion client with stored API key
   */
  async initClient() {
    const apiKey = await storage.getApiKey();
    if (!apiKey) {
      throw new Error('Notion API key is not configured');
    }
    this.client = new Client({ auth: apiKey });
    return this.client;
  }

  /**
   * Create a temporary client with provided API key (for validation)
   */
  createTempClient(apiKey) {
    return new Client({ auth: apiKey });
  }

  /**
   * Validate API key by calling users.me()
   * @param {string} apiKey - Notion API key to validate
   * @returns {Promise<{valid: boolean, user?: object, error?: string}>}
   */
  async validateApiKey(apiKey) {
    try {
      const client = this.createTempClient(apiKey);
      const response = await client.users.me();
      return {
        valid: true,
        user: {
          id: response.id,
          name: response.name,
          type: response.type,
          avatarUrl: response.avatar_url
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Validate page access by calling pages.retrieve()
   * @param {string} pageId - Notion page ID
   * @param {string} apiKey - Optional API key (uses stored key if not provided)
   * @returns {Promise<{valid: boolean, page?: object, error?: string}>}
   */
  async validatePageAccess(pageId, apiKey = null) {
    try {
      const client = apiKey 
        ? this.createTempClient(apiKey) 
        : await this.initClient();
      
      const response = await client.pages.retrieve({ page_id: pageId });
      
      // Extract title from properties
      let title = 'Untitled';
      if (response.properties?.title?.title?.[0]?.plain_text) {
        title = response.properties.title.title[0].plain_text;
      } else if (response.properties?.Name?.title?.[0]?.plain_text) {
        title = response.properties.Name.title[0].plain_text;
      }
      
      return {
        valid: true,
        page: {
          id: response.id,
          title: title,
          url: response.url,
          createdTime: response.created_time,
          lastEditedTime: response.last_edited_time
        }
      };
    } catch (error) {
      return {
        valid: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Create a new page with markdown content
   * @param {string} parentPageId - Parent page ID
   * @param {string} title - Page title
   * @param {Array} blocks - Notion blocks array
   * @returns {Promise<{success: boolean, page?: object, error?: string}>}
   */
  async createPage(parentPageId, title, blocks) {
    try {
      const client = await this.initClient();
      
      // Split blocks if exceeding limit
      const initialBlocks = blocks.slice(0, MAX_BLOCKS_PER_REQUEST);
      const remainingBlocks = blocks.slice(MAX_BLOCKS_PER_REQUEST);
      
      // Create page with initial blocks
      const response = await client.pages.create({
        parent: { page_id: parentPageId },
        properties: {
          title: [{ text: { content: title } }]
        },
        children: initialBlocks
      });
      
      // Append remaining blocks in batches
      if (remainingBlocks.length > 0) {
        await this.appendBlocks(response.id, remainingBlocks);
      }
      
      return {
        success: true,
        page: {
          id: response.id,
          url: response.url,
          title: title
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Append blocks to an existing page in batches
   */
  async appendBlocks(pageId, blocks) {
    const client = await this.initClient();
    
    for (let i = 0; i < blocks.length; i += MAX_BLOCKS_PER_REQUEST) {
      const batch = blocks.slice(i, i + MAX_BLOCKS_PER_REQUEST);
      await client.blocks.children.append({
        block_id: pageId,
        children: batch
      });
    }
  }

  /**
   * Format Notion API errors into user-friendly messages
   */
  formatError(error) {
    const code = error.code || error.status;
    const message = error.message || 'Unknown error occurred';
    
    const errorMessages = {
      'unauthorized': 'Invalid API key. Please check your Notion integration token.',
      'object_not_found': 'Page not found. Please check if the page exists and is shared with your integration.',
      'rate_limited': 'Too many requests. Please wait a moment and try again.',
      'validation_error': 'Invalid request format. Please check your input.',
      'internal_server_error': 'Notion server error. Please try again later.',
      'service_unavailable': 'Notion service is temporarily unavailable. Please try again later.'
    };
    
    return errorMessages[code] || message;
  }
}

export const notionService = new NotionService();

