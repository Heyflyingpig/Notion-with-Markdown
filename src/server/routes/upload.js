/**
 * upload.js - Markdown upload routes
 */

import { storage } from '../services/storage.js';
import { notionService } from '../services/notion.js';
import { markdownService } from '../services/markdown.js';
import { validateMarkdown, getMarkdownStats } from '../utils/validator.js';

export async function uploadRoutes(fastify) {
  /**
   * POST /api/upload
   * Upload markdown content to Notion
   */
  fastify.post('/api/upload', {
    schema: {
      body: {
        type: 'object',
        required: ['markdown'],
        properties: {
          markdown: { type: 'string', minLength: 1 },
          pageConfigId: { type: 'string' },
          title: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { markdown, pageConfigId, title } = request.body;
    
    // Validate markdown
    const settings = await storage.db.data.settings;
    const validation = validateMarkdown(markdown, settings?.maxFileSize);
    if (!validation.valid) {
      return reply.code(400).send({
        success: false,
        error: validation.error
      });
    }
    
    // Get target page configuration
    let targetPage;
    if (pageConfigId) {
      const pages = await storage.getPages();
      targetPage = pages.find(p => p.id === pageConfigId);
    } else {
      targetPage = await storage.getDefaultPage();
    }
    
    if (!targetPage) {
      return reply.code(400).send({
        success: false,
        error: 'No target page configured. Please add a page configuration first.'
      });
    }
    
    // Extract or use provided title
    const pageTitle = title || markdownService.extractTitle(markdown);
    
    // Convert markdown to Notion blocks
    let blocks;
    try {
      blocks = markdownService.convertToBlocks(markdown);
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: `Failed to convert markdown: ${error.message}`
      });
    }
    
    // Create Notion page
    const result = await notionService.createPage(
      targetPage.pageId,
      pageTitle,
      blocks
    );
    
    // Record history
    await storage.addHistory({
      title: pageTitle,
      pageConfigId: targetPage.id,
      notionPageId: result.success ? result.page.id : null,
      notionUrl: result.success ? result.page.url : null,
      status: result.success ? 'success' : 'failed',
      error: result.error || null
    });
    
    if (result.success) {
      return {
        success: true,
        page: result.page,
        stats: getMarkdownStats(markdown)
      };
    } else {
      return reply.code(500).send({
        success: false,
        error: result.error
      });
    }
  });

  /**
   * POST /api/upload/file
   * Upload markdown file to Notion
   */
  fastify.post('/api/upload/file', async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: 'No file uploaded'
        });
      }
      
      // Check file type
      const filename = data.filename.toLowerCase();
      if (!filename.endsWith('.md') && !filename.endsWith('.txt')) {
        return reply.code(400).send({
          success: false,
          error: 'Invalid file type. Only .md and .txt files are allowed.'
        });
      }
      
      // Read file content
      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const markdown = Buffer.concat(chunks).toString('utf-8');
      
      // Get page config from fields
      const fields = data.fields;
      const pageConfigId = fields?.pageConfigId?.value;
      const title = fields?.title?.value;
      
      // Validate and process (reuse logic from /api/upload)
      const settings = await storage.db.data.settings;
      const validation = validateMarkdown(markdown, settings?.maxFileSize);
      if (!validation.valid) {
        return reply.code(400).send({
          success: false,
          error: validation.error
        });
      }
      
      let targetPage;
      if (pageConfigId) {
        const pages = await storage.getPages();
        targetPage = pages.find(p => p.id === pageConfigId);
      } else {
        targetPage = await storage.getDefaultPage();
      }
      
      if (!targetPage) {
        return reply.code(400).send({
          success: false,
          error: 'No target page configured.'
        });
      }
      
      const pageTitle = title || markdownService.extractTitle(markdown);
      const blocks = markdownService.convertToBlocks(markdown);
      const result = await notionService.createPage(targetPage.pageId, pageTitle, blocks);
      
      await storage.addHistory({
        title: pageTitle,
        pageConfigId: targetPage.id,
        notionPageId: result.success ? result.page.id : null,
        notionUrl: result.success ? result.page.url : null,
        status: result.success ? 'success' : 'failed',
        error: result.error || null
      });
      
      if (result.success) {
        return { success: true, page: result.page, stats: getMarkdownStats(markdown) };
      } else {
        return reply.code(500).send({ success: false, error: result.error });
      }
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: `File upload failed: ${error.message}`
      });
    }
  });

  /**
   * POST /api/upload/preview
   * Preview markdown statistics without uploading
   */
  fastify.post('/api/upload/preview', {
    schema: {
      body: {
        type: 'object',
        required: ['markdown'],
        properties: {
          markdown: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { markdown } = request.body;
    
    const title = markdownService.extractTitle(markdown);
    const stats = markdownService.getStats(markdown);
    
    return {
      title,
      stats
    };
  });
}

