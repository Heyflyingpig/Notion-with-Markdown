/**
 * config.js - Configuration management component
 */

function configComponent() {
  return {
    pages: [],
    settings: {},
    loading: true,
    showAddModal: false,
    showEditModal: false,
    showApiKeyModal: false,
    editingPage: null,
    newPage: { name: '', pageUrl: '' },
    newApiKey: '',
    validating: false,
    error: '',
    
    async init() {
      await Promise.all([
        this.loadPages(),
        this.loadSettings()
      ]);
      this.loading = false;
    },
    
    async loadPages() {
      try {
        const data = await apiCall('/config/pages');
        this.pages = data.pages;
      } catch (error) {
        console.error('Failed to load pages:', error);
      }
    },
    
    async loadSettings() {
      try {
        const data = await apiCall('/settings');
        this.settings = data.settings;
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    },
    
    async addPage() {
      this.validating = true;
      this.error = '';
      
      try {
        await apiCall('/config/pages', {
          method: 'POST',
          body: JSON.stringify(this.newPage)
        });
        
        await this.loadPages();
        this.showAddModal = false;
        this.newPage = { name: '', pageUrl: '' };
        this.$dispatch('toast', { message: 'Page added successfully', type: 'success' });
      } catch (error) {
        this.error = error.message;
      } finally {
        this.validating = false;
      }
    },
    
    openEditModal(page) {
      this.editingPage = { ...page };
      this.showEditModal = true;
      this.error = '';
    },
    
    async updatePage() {
      this.validating = true;
      this.error = '';
      
      try {
        await apiCall(`/config/pages/${this.editingPage.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: this.editingPage.name,
            isDefault: this.editingPage.isDefault
          })
        });
        
        await this.loadPages();
        this.showEditModal = false;
        this.$dispatch('toast', { message: 'Page updated successfully', type: 'success' });
      } catch (error) {
        this.error = error.message;
      } finally {
        this.validating = false;
      }
    },
    
    async deletePage(id) {
      if (!confirm('Are you sure you want to delete this page configuration?')) return;
      
      try {
        await apiCall(`/config/pages/${id}`, { method: 'DELETE' });
        await this.loadPages();
        this.$dispatch('toast', { message: 'Page deleted successfully', type: 'success' });
      } catch (error) {
        this.$dispatch('toast', { message: error.message, type: 'error' });
      }
    },
    
    async setDefault(id) {
      try {
        await apiCall(`/config/pages/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ isDefault: true })
        });
        await this.loadPages();
      } catch (error) {
        this.$dispatch('toast', { message: error.message, type: 'error' });
      }
    },
    
    async updateApiKey() {
      this.validating = true;
      this.error = '';
      
      try {
        await apiCall('/config/api-key', {
          method: 'POST',
          body: JSON.stringify({ apiKey: this.newApiKey })
        });
        
        this.showApiKeyModal = false;
        this.newApiKey = '';
        this.$dispatch('toast', { message: 'API key updated successfully', type: 'success' });
      } catch (error) {
        this.error = error.message;
      } finally {
        this.validating = false;
      }
    },
    
    async updateSettings() {
      try {
        await apiCall('/settings', {
          method: 'PUT',
          body: JSON.stringify(this.settings)
        });
        this.$dispatch('toast', { message: 'Settings saved', type: 'success' });
      } catch (error) {
        this.$dispatch('toast', { message: error.message, type: 'error' });
      }
    }
  };
}

