/**
 * app.js - Main Alpine.js application logic
 */

// API base URL
const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
}

// Main app component
function app() {
  return {
    currentView: 'dashboard',
    status: {
      configured: false,
      hasApiKey: false,
      pageCount: 0,
      defaultPage: null
    },
    toast: {
      show: false,
      message: '',
      type: 'info'
    },
    
    async init() {
      await this.loadStatus();
    },
    
    async loadStatus() {
      try {
        const data = await apiCall('/config/status');
        this.status = data;
      } catch (error) {
        console.error('Failed to load status:', error);
      }
    },
    
    showToast(message, type = 'info') {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    }
  };
}

// Dashboard component
function dashboard() {
  return {
    recentHistory: [],
    loading: true,
    pageCount: 0,

    async init() {
      await Promise.all([
        this.loadRecentHistory(),
        this.loadPageCount()
      ]);
      this.loading = false;
    },

    async loadRecentHistory() {
      try {
        const data = await apiCall('/history/recent?limit=5');
        this.recentHistory = data.history;
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    },

    async loadPageCount() {
      try {
        const data = await apiCall('/config/pages');
        this.pageCount = data.pages?.length || 0;
      } catch (error) {
        console.error('Failed to load page count:', error);
      }
    },

    goToUpload() {
      // Get parent app component and change view
      const appEl = this.$el.closest('[x-data*="app"]');
      if (appEl && appEl.__x) {
        appEl.__x.$data.currentView = 'upload';
      }
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString('zh-CN');
    }
  };
}

// Setup wizard component
function setupWizard() {
  return {
    step: 1,
    apiKey: '',
    pageUrl: '',
    pageName: '',
    validating: false,
    validated: { apiKey: false, page: false },
    validationResult: { user: null, page: null },
    error: '',
    
    async validateApiKey() {
      this.validating = true;
      this.error = '';
      
      try {
        const data = await apiCall('/validate/api-key', {
          method: 'POST',
          body: JSON.stringify({ apiKey: this.apiKey })
        });
        
        this.validated.apiKey = true;
        this.validationResult.user = data.user;
      } catch (error) {
        this.error = error.message;
        this.validated.apiKey = false;
      } finally {
        this.validating = false;
      }
    },
    
    async validatePage() {
      this.validating = true;
      this.error = '';
      
      try {
        const data = await apiCall('/validate/page', {
          method: 'POST',
          body: JSON.stringify({ pageUrl: this.pageUrl, apiKey: this.apiKey })
        });
        
        this.validated.page = true;
        this.validationResult.page = data.page;
        if (!this.pageName) {
          this.pageName = data.page.title;
        }
      } catch (error) {
        this.error = error.message;
        this.validated.page = false;
      } finally {
        this.validating = false;
      }
    },
    
    async saveConfig() {
      this.validating = true;
      this.error = '';
      
      try {
        // Save API key
        await apiCall('/config/api-key', {
          method: 'POST',
          body: JSON.stringify({ apiKey: this.apiKey })
        });
        
        // Add page configuration
        await apiCall('/config/pages', {
          method: 'POST',
          body: JSON.stringify({
            name: this.pageName,
            pageUrl: this.pageUrl,
            isDefault: true
          })
        });
        
        // Reload status and go to dashboard
        Alpine.store('app')?.loadStatus?.();
        this.step = 4;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.validating = false;
      }
    },
    
    nextStep() {
      if (this.step < 4) this.step++;
    },
    
    prevStep() {
      if (this.step > 1) this.step--;
    }
  };
}

// History component
function historyComponent() {
  return {
    history: [],
    loading: true,
    search: '',
    
    async init() {
      await this.loadHistory();
      this.loading = false;
    },
    
    async loadHistory() {
      try {
        const params = new URLSearchParams();
        if (this.search) params.append('search', this.search);
        
        const data = await apiCall(`/history?${params.toString()}`);
        this.history = data.history;
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    },
    
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString('zh-CN');
    },
    
    openInNotion(url) {
      window.open(url, '_blank');
    }
  };
}

