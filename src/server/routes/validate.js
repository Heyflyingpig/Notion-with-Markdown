/**
 * validate.js - API validation routes
 */

import { notionService } from '../services/notion.js';
import { extractPageId, isValidApiKeyFormat } from '../utils/validator.js';

export async function validateRoutes(fastify) {
  /**
   * POST /api/validate/api-key
   * Validate Notion API key
   */
  fastify.post('/api/validate/api-key', {
    schema: {
      body: {
        type: 'object',
        required: ['apiKey'],
        properties: {
          apiKey: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const { apiKey } = request.body;
    
    // Basic format validation
    if (!isValidApiKeyFormat(apiKey)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid API key format. Notion API keys should start with "secret_" or "ntn_".'
      });
    }
    
    // Validate with Notion API
    const result = await notionService.validateApiKey(apiKey);
    
    if (result.valid) {
      return {
        success: true,
        user: result.user
      };
    } else {
      return reply.code(400).send({
        success: false,
        error: result.error
      });
    }
  });

  /**
   * POST /api/validate/page
   * Validate Notion page access
   */
  fastify.post('/api/validate/page', {
    schema: {
      body: {
        type: 'object',
        required: ['pageUrl'],
        properties: {
          pageUrl: { type: 'string', minLength: 1 },
          apiKey: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { pageUrl, apiKey } = request.body;
    
    // Extract page ID from URL
    const pageId = extractPageId(pageUrl);
    if (!pageId) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid Notion page URL or ID. Please provide a valid Notion page link.'
      });
    }
    
    // Validate page access
    const result = await notionService.validatePageAccess(pageId, apiKey);
    
    if (result.valid) {
      return {
        success: true,
        pageId: pageId,
        page: result.page
      };
    } else {
      return reply.code(400).send({
        success: false,
        error: result.error
      });
    }
  });

  /**
   * POST /api/validate/full
   * Full validation: API key + page access
   */
  fastify.post('/api/validate/full', {
    schema: {
      body: {
        type: 'object',
        required: ['apiKey', 'pageUrl'],
        properties: {
          apiKey: { type: 'string', minLength: 1 },
          pageUrl: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const { apiKey, pageUrl } = request.body;
    
    // Step 1: Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
      return reply.code(400).send({
        success: false,
        step: 'api-key-format',
        error: 'Invalid API key format. Notion API keys should start with "secret_" or "ntn_".'
      });
    }
    
    // Step 2: Validate API key with Notion
    const apiResult = await notionService.validateApiKey(apiKey);
    if (!apiResult.valid) {
      return reply.code(400).send({
        success: false,
        step: 'api-key-validation',
        error: apiResult.error
      });
    }
    
    // Step 3: Extract page ID
    const pageId = extractPageId(pageUrl);
    if (!pageId) {
      return reply.code(400).send({
        success: false,
        step: 'page-id-extraction',
        error: 'Invalid Notion page URL or ID.'
      });
    }
    
    // Step 4: Validate page access
    const pageResult = await notionService.validatePageAccess(pageId, apiKey);
    if (!pageResult.valid) {
      return reply.code(400).send({
        success: false,
        step: 'page-access',
        error: pageResult.error
      });
    }
    
    return {
      success: true,
      user: apiResult.user,
      pageId: pageId,
      page: pageResult.page
    };
  });
}

