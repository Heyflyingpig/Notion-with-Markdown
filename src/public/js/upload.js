/**
 * upload.js - Markdown upload component
 */

function uploadComponent() {
  return {
    markdown: '',
    title: '',
    selectedPageId: '',
    pages: [],
    stats: { chars: 0, lines: 0, words: 0 },
    uploading: false,
    uploadResult: null,
    error: '',
    dragover: false,
    settings: {},
    
    async init() {
      await Promise.all([
        this.loadPages(),
        this.loadSettings()
      ]);
    },
    
    async loadPages() {
      try {
        const data = await apiCall('/config/pages');
        this.pages = data.pages;
        const defaultPage = this.pages.find(p => p.isDefault);
        if (defaultPage) {
          this.selectedPageId = defaultPage.id;
        }
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
    
    updateStats() {
      const text = this.markdown || '';
      this.stats = {
        chars: text.length,
        lines: text.split('\n').length,
        words: text.trim().split(/\s+/).filter(w => w.length > 0).length
      };
    },
    
    async upload() {
      if (!this.markdown.trim()) {
        this.error = 'Please enter some markdown content';
        return;
      }
      
      if (!this.selectedPageId) {
        this.error = 'Please select a target page';
        return;
      }
      
      this.uploading = true;
      this.error = '';
      this.uploadResult = null;
      
      try {
        const data = await apiCall('/upload', {
          method: 'POST',
          body: JSON.stringify({
            markdown: this.markdown,
            pageConfigId: this.selectedPageId,
            title: this.title || null
          })
        });
        
        this.uploadResult = data;
        this.$dispatch('toast', { message: 'Upload successful!', type: 'success' });
        
        // Auto open Notion if enabled
        if (this.settings.autoOpenNotion && data.page?.url) {
          window.open(data.page.url, '_blank');
        }
        
        // Auto clear if enabled
        if (this.settings.autoClearInput) {
          this.clearInput();
        }
      } catch (error) {
        this.error = error.message;
        this.$dispatch('toast', { message: error.message, type: 'error' });
      } finally {
        this.uploading = false;
      }
    },
    
    clearInput() {
      this.markdown = '';
      this.title = '';
      this.uploadResult = null;
      this.error = '';
      this.updateStats();
    },
    
    async pasteFromClipboard() {
      try {
        const text = await navigator.clipboard.readText();
        this.markdown = text;
        this.updateStats();
        this.$dispatch('toast', { message: 'Pasted from clipboard', type: 'success' });
      } catch (error) {
        this.$dispatch('toast', { message: 'Failed to read clipboard', type: 'error' });
      }
    },
    
    handleDragOver(e) {
      e.preventDefault();
      this.dragover = true;
    },
    
    handleDragLeave() {
      this.dragover = false;
    },
    
    async handleDrop(e) {
      e.preventDefault();
      this.dragover = false;
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        await this.handleFile(files[0]);
      }
    },
    
    async handleFileSelect(e) {
      const files = e.target?.files;
      if (files && files.length > 0) {
        await this.handleFile(files[0]);
      }
    },
    
    async handleFile(file) {
      const validTypes = ['.md', '.txt'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(ext)) {
        this.error = 'Invalid file type. Only .md and .txt files are allowed.';
        return;
      }
      
      if (file.size > (this.settings.maxFileSize || 10485760)) {
        this.error = 'File size exceeds maximum allowed size.';
        return;
      }
      
      try {
        const text = await file.text();
        this.markdown = text;
        this.updateStats();
        this.$dispatch('toast', { message: `Loaded: ${file.name}`, type: 'success' });
      } catch (error) {
        this.error = 'Failed to read file';
      }
    },
    
    copyLink() {
      if (this.uploadResult?.page?.url) {
        navigator.clipboard.writeText(this.uploadResult.page.url);
        this.$dispatch('toast', { message: 'Link copied!', type: 'success' });
      }
    },
    
    openInNotion() {
      if (this.uploadResult?.page?.url) {
        window.open(this.uploadResult.page.url, '_blank');
      }
    }
  };
}

