/**
 * history.js - Upload history routes
 */

import { storage } from '../services/storage.js';

export async function historyRoutes(fastify) {
  /**
   * GET /api/history
   * Get upload history
   */
  fastify.get('/api/history', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          search: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { limit = 50, search = '' } = request.query;
    
    const history = await storage.getHistory(limit, search);
    const pages = await storage.getPages();
    
    // Enrich history with page names
    const enrichedHistory = history.map(record => {
      const pageConfig = pages.find(p => p.id === record.pageConfigId);
      return {
        ...record,
        pageConfigName: pageConfig?.name || 'Unknown Page'
      };
    });
    
    return {
      history: enrichedHistory,
      total: enrichedHistory.length
    };
  });

  /**
   * GET /api/history/recent
   * Get recent upload history (for dashboard)
   */
  fastify.get('/api/history/recent', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 10, default: 5 }
        }
      }
    }
  }, async (request, reply) => {
    const { limit = 5 } = request.query;
    
    const history = await storage.getHistory(limit);
    const pages = await storage.getPages();
    
    const enrichedHistory = history.map(record => {
      const pageConfig = pages.find(p => p.id === record.pageConfigId);
      return {
        ...record,
        pageConfigName: pageConfig?.name || 'Unknown Page'
      };
    });
    
    return {
      history: enrichedHistory
    };
  });

  /**
   * GET /api/settings
   * Get user settings
   */
  fastify.get('/api/settings', async (request, reply) => {
    await storage.init();
    return {
      settings: storage.db.data.settings
    };
  });

  /**
   * PUT /api/settings
   * Update user settings
   */
  fastify.put('/api/settings', {
    schema: {
      body: {
        type: 'object',
        properties: {
          autoOpenNotion: { type: 'boolean' },
          autoClearInput: { type: 'boolean' },
          maxFileSize: { type: 'integer', minimum: 1048576 }
        }
      }
    }
  }, async (request, reply) => {
    const updates = request.body;
    
    await storage.init();
    Object.assign(storage.db.data.settings, updates);
    await storage.db.write();
    
    return {
      success: true,
      settings: storage.db.data.settings
    };
  });
}

