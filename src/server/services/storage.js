/**
 * storage.js - lowdb storage service for configuration and history management
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { encrypt, decrypt } from '../utils/crypto.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../../data');
const DB_PATH = join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Default database structure
const defaultData = {
  config: {
    apiKey: null,
    defaultPageId: null
  },
  pages: [],
  history: [],
  settings: {
    autoOpenNotion: false,
    autoClearInput: true,
    maxFileSize: 10485760 // 10MB
  }
};

class StorageService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    const adapter = new JSONFile(DB_PATH);
    this.db = new Low(adapter, defaultData);
    await this.db.read();
    
    // Initialize with default data if empty
    if (!this.db.data) {
      this.db.data = defaultData;
      await this.db.write();
    }
    
    this.initialized = true;
  }

  // API Key Management
  async getApiKey() {
    await this.init();
    const encrypted = this.db.data.config.apiKey;
    return encrypted ? decrypt(encrypted) : null;
  }

  async setApiKey(apiKey) {
    await this.init();
    this.db.data.config.apiKey = apiKey ? encrypt(apiKey) : null;
    await this.db.write();
  }

  async hasApiKey() {
    await this.init();
    return !!this.db.data.config.apiKey;
  }

  // Page Configuration Management
  async getPages() {
    await this.init();
    return this.db.data.pages || [];
  }

  async addPage(page) {
    await this.init();
    const newPage = {
      id: nanoid(),
      name: page.name,
      pageId: page.pageId,
      url: page.url || null,
      isDefault: page.isDefault || false,
      createdAt: dayjs().toISOString()
    };
    
    // If this is the first page or marked as default, set it as default
    if (newPage.isDefault || this.db.data.pages.length === 0) {
      this.db.data.pages.forEach(p => p.isDefault = false);
      newPage.isDefault = true;
      this.db.data.config.defaultPageId = newPage.id;
    }
    
    this.db.data.pages.push(newPage);
    await this.db.write();
    return newPage;
  }

  async updatePage(id, updates) {
    await this.init();
    const index = this.db.data.pages.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const page = this.db.data.pages[index];
    Object.assign(page, updates, { updatedAt: dayjs().toISOString() });
    
    if (updates.isDefault) {
      this.db.data.pages.forEach(p => {
        if (p.id !== id) p.isDefault = false;
      });
      this.db.data.config.defaultPageId = id;
    }
    
    await this.db.write();
    return page;
  }

  async deletePage(id) {
    await this.init();
    const index = this.db.data.pages.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    const wasDefault = this.db.data.pages[index].isDefault;
    this.db.data.pages.splice(index, 1);
    
    // If deleted page was default, set first remaining page as default
    if (wasDefault && this.db.data.pages.length > 0) {
      this.db.data.pages[0].isDefault = true;
      this.db.data.config.defaultPageId = this.db.data.pages[0].id;
    } else if (this.db.data.pages.length === 0) {
      this.db.data.config.defaultPageId = null;
    }
    
    await this.db.write();
    return true;
  }

  async getDefaultPage() {
    await this.init();
    return this.db.data.pages.find(p => p.isDefault) || null;
  }

  // History Management
  async addHistory(record) {
    await this.init();
    const newRecord = {
      id: nanoid(),
      title: record.title,
      pageConfigId: record.pageConfigId,
      notionPageId: record.notionPageId,
      notionUrl: record.notionUrl,
      status: record.status,
      error: record.error || null,
      createdAt: dayjs().toISOString()
    };
    
    this.db.data.history.unshift(newRecord);
    // Keep only last 100 records
    if (this.db.data.history.length > 100) {
      this.db.data.history = this.db.data.history.slice(0, 100);
    }
    
    await this.db.write();
    return newRecord;
  }

  async getHistory(limit = 50, search = '') {
    await this.init();
    let history = this.db.data.history || [];
    
    if (search) {
      const searchLower = search.toLowerCase();
      history = history.filter(h => 
        h.title.toLowerCase().includes(searchLower)
      );
    }
    
    return history.slice(0, limit);
  }
}

export const storage = new StorageService();

