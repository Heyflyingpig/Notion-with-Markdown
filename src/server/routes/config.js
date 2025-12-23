/**
 * config.js - Configuration management routes
 */

import { storage } from '../services/storage.js';
import { notionService } from '../services/notion.js';
import { extractPageId, isValidApiKeyFormat } from '../utils/validator.js';

export async function configRoutes(fastify) {
  /**
   * GET /api/config/status
   * Get current configuration status
   */
  fastify.get('/api/config/status', async (request, reply) => {
    const hasApiKey = await storage.hasApiKey();
    const pages = await storage.getPages();
    const defaultPage = await storage.getDefaultPage();
    
    return {
      configured: hasApiKey && pages.length > 0,
      hasApiKey,
      pageCount: pages.length,
      defaultPage: defaultPage ? {
        id: defaultPage.id,
        name: defaultPage.name,
        pageId: defaultPage.pageId
      } : null
    };
  });

  /**
   * POST /api/config/api-key
   * Save Notion API key
   */
  fastify.post('/api/config/api-key', {
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
    
    if (!isValidApiKeyFormat(apiKey)) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid API key format'
      });
    }
    
    // Validate before saving
    const result = await notionService.validateApiKey(apiKey);
    if (!result.valid) {
      return reply.code(400).send({
        success: false,
        error: result.error
      });
    }
    
    await storage.setApiKey(apiKey);
    
    return {
      success: true,
      message: 'API key saved successfully'
    };
  });

  /**
   * GET /api/config/pages
   * Get all page configurations
   */
  fastify.get('/api/config/pages', async (request, reply) => {
    const pages = await storage.getPages();
    return { pages };
  });

  /**
   * POST /api/config/pages
   * Add a new page configuration
   */
  fastify.post('/api/config/pages', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'pageUrl'],
        properties: {
          name: { type: 'string', minLength: 1 },
          pageUrl: { type: 'string', minLength: 1 },
          isDefault: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const { name, pageUrl, isDefault } = request.body;
    
    const pageId = extractPageId(pageUrl);
    if (!pageId) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid Notion page URL or ID'
      });
    }
    
    // Validate page access
    const result = await notionService.validatePageAccess(pageId);
    if (!result.valid) {
      return reply.code(400).send({
        success: false,
        error: result.error
      });
    }
    
    const page = await storage.addPage({
      name,
      pageId,
      url: result.page.url,
      isDefault
    });
    
    return {
      success: true,
      page
    };
  });

  /**
   * PUT /api/config/pages/:id
   * Update a page configuration
   */
  fastify.put('/api/config/pages/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          isDefault: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    const page = await storage.updatePage(id, updates);
    
    if (!page) {
      return reply.code(404).send({
        success: false,
        error: 'Page configuration not found'
      });
    }
    
    return {
      success: true,
      page
    };
  });

  /**
   * DELETE /api/config/pages/:id
   * Delete a page configuration
   */
  fastify.delete('/api/config/pages/:id', async (request, reply) => {
    const { id } = request.params;
    
    const deleted = await storage.deletePage(id);
    
    if (!deleted) {
      return reply.code(404).send({
        success: false,
        error: 'Page configuration not found'
      });
    }
    
    return {
      success: true,
      message: 'Page configuration deleted'
    };
  });
}

