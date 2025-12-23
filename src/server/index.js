/**
 * index.js - Fastify server entry point
 * MD to Notion Web visualization interface
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env from project root
const __dirname_temp = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname_temp, '../../.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';

// Import routes
import { configRoutes } from './routes/config.js';
import { validateRoutes } from './routes/validate.js';
import { uploadRoutes } from './routes/upload.js';
import { historyRoutes } from './routes/history.js';

const __dirname = __dirname_temp;

// Create Fastify instance with logging
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Register plugins
async function registerPlugins() {
  // CORS support
  await fastify.register(fastifyCors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  });

  // Multipart file upload support
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  });

  // Static files (frontend)
  await fastify.register(fastifyStatic, {
    root: join(__dirname, '../public'),
    prefix: '/'
  });
}

// Register API routes
async function registerRoutes() {
  await fastify.register(configRoutes);
  await fastify.register(validateRoutes);
  await fastify.register(uploadRoutes);
  await fastify.register(historyRoutes);
}

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  reply.status(statusCode).send({
    success: false,
    error: message,
    code: error.code || 'INTERNAL_ERROR'
  });
});

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    await fastify.listen({ port: PORT, host: HOST });
    
    console.log(`
    =============================================
      MD to Notion Web Server
    =============================================
      Local:   http://${HOST}:${PORT}
      API:     http://${HOST}:${PORT}/api
    =============================================
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

