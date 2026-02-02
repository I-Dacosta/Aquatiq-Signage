/**
 * Aquatiq Signage Player - Tizen/MagicInfo Compatible
 * Version: 1.0.0
 * 
 * Tizen-safe JavaScript (ES5 compatible)
 * No modules, arrow functions, let/const, or modern APIs
 */

(function() {
  'use strict';
  
  // Polyfills for older browsers
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(search) {
      return this.indexOf(search) !== -1;
    };
  }
  
  if (!String.prototype.includes) {
    String.prototype.includes = function(search) {
      return this.indexOf(search) !== -1;
    };
  }
  
  // Main SignagePlayer object
  var SignagePlayer = {
    config: {
      serverUrl: window.SIGNAGE_SERVER_URL || 'https://signage.aquatiq.com',
      macAddress: null,
      heartbeatInterval: 30000, // 30 seconds
      contentCheckInterval: 60000, // 1 minute
      fallbackContent: '/offline.html',
      retryAttempts: 3,
      retryDelay: 5000 // 5 seconds
    },
    
    currentContentId: null,
    currentScheduleId: null,
    contentTimer: null,
    heartbeatTimer: null,
    retryCount: 0,
    
    init: function() {
      console.log('[SignagePlayer] Initializing...');
      this.detectMacAddress();
      
      if (!this.config.macAddress) {
        console.error('[SignagePlayer] MAC address not detected, using fallback');
        this.displayFallback();
        return;
      }
      
      console.log('[SignagePlayer] MAC Address:', this.config.macAddress);
      this.startHeartbeat();
      this.loadCurrentContent();
      this.startScheduleChecker();
    },
    
    detectMacAddress: function() {
      try {
        // Method 1: Tizen Network API
        if (typeof tizen !== 'undefined' && tizen.systeminfo) {
          var self = this;
          tizen.systeminfo.getPropertyValue('NETWORK', function(network) {
            self.config.macAddress = network.mac;
            console.log('[SignagePlayer] MAC from Tizen API:', network.mac);
          });
          return;
        }
      } catch (e) {
        console.warn('[SignagePlayer] Tizen API failed:', e.message);
      }
      
      // Method 2: URL parameter
      var params = this.parseQueryString(window.location.search);
      if (params.mac) {
        this.config.macAddress = params.mac;
        localStorage.setItem('mac', params.mac);
        console.log('[SignagePlayer] MAC from URL:', params.mac);
        return;
      }
      
      // Method 3: localStorage
      var stored = localStorage.getItem('mac');
      if (stored) {
        this.config.macAddress = stored;
        console.log('[SignagePlayer] MAC from storage:', stored);
        return;
      }
      
      console.error('[SignagePlayer] MAC address detection failed');
    },
    
    parseQueryString: function(query) {
      var params = {};
      if (!query) return params;
      
      var pairs = query.substring(1).split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
      }
      return params;
    },
    
    startHeartbeat: function() {
      var self = this;
      
      // Send initial heartbeat
      this.sendHeartbeat();
      
      // Set up interval
      this.heartbeatTimer = setInterval(function() {
        self.sendHeartbeat();
      }, this.config.heartbeatInterval);
    },
    
    sendHeartbeat: function() {
      var self = this;
      var xhr = new XMLHttpRequest();
      
      xhr.open('POST', this.config.serverUrl + '/api/screen-api/' + 
        this.config.macAddress + '/heartbeat', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          console.log('[SignagePlayer] Heartbeat sent successfully');
          self.retryCount = 0;
        } else {
          console.error('[SignagePlayer] Heartbeat failed:', xhr.status);
        }
      };
      
      xhr.onerror = function() {
        console.error('[SignagePlayer] Heartbeat network error');
      };
      
      xhr.send(JSON.stringify({
        ip_address: this.getLocalIP(),
        content_id: this.currentContentId,
        timestamp: new Date().toISOString()
      }));
    },
    
    getLocalIP: function() {
      // Placeholder - actual IP detection varies by platform
      return 'unknown';
    },
    
    loadCurrentContent: function() {
      var self = this;
      var xhr = new XMLHttpRequest();
      
      console.log('[SignagePlayer] Loading current content...');
      
      xhr.open('GET', this.config.serverUrl + '/api/screen-api/' + 
        this.config.macAddress + '/current', true);
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            console.log('[SignagePlayer] Content loaded:', data);
            
            // Cache content for offline fallback
            localStorage.setItem('lastContent', xhr.responseText);
            
            self.displayContent(data);
            self.retryCount = 0;
          } catch (e) {
            console.error('[SignagePlayer] Parse error:', e.message);
            self.handleLoadError();
          }
        } else {
          console.error('[SignagePlayer] Load failed:', xhr.status);
          self.handleLoadError();
        }
      };
      
      xhr.onerror = function() {
        console.error('[SignagePlayer] Network error');
        self.handleLoadError();
      };
      
      xhr.send();
    },
    
    handleLoadError: function() {
      this.retryCount++;
      
      if (this.retryCount < this.config.retryAttempts) {
        console.log('[SignagePlayer] Retry attempt', this.retryCount);
        var self = this;
        setTimeout(function() {
          self.loadCurrentContent();
        }, this.config.retryDelay);
      } else {
        console.error('[SignagePlayer] Max retries reached, using fallback');
        this.displayFallback();
      }
    },
    
    displayContent: function(data) {
      if (!data || !data.url) {
        console.error('[SignagePlayer] Invalid content data');
        this.displayFallback();
        return;
      }
      
      this.currentContentId = data.content_id;
      this.currentScheduleId = data.schedule_id;
      
      var duration = data.duration || 30;
      console.log('[SignagePlayer] Displaying content for', duration, 'seconds');
      
      // Navigate to content URL
      if (window.location.href !== data.url) {
        window.location.href = data.url;
      }
      
      // Schedule next content check
      this.scheduleNextContent(duration);
    },
    
    displayFallback: function() {
      console.log('[SignagePlayer] Displaying fallback content');
      
      // Try fallback strategies in order
      var content = FallbackManager.getContent();
      
      if (content) {
        if (content.url) {
          window.location.href = content.url;
        } else if (content.html) {
          document.body.innerHTML = content.html;
        }
        
        // Retry loading after fallback duration
        var self = this;
        setTimeout(function() {
          self.retryCount = 0;
          self.loadCurrentContent();
        }, (content.duration || 60) * 1000);
      }
    },
    
    scheduleNextContent: function(seconds) {
      var self = this;
      
      // Clear existing timer
      if (this.contentTimer) {
        clearTimeout(this.contentTimer);
      }
      
      // Schedule next content load
      this.contentTimer = setTimeout(function() {
        self.loadCurrentContent();
      }, seconds * 1000);
    },
    
    startScheduleChecker: function() {
      var self = this;
      
      // Check for schedule changes every minute
      setInterval(function() {
        self.checkScheduleChange();
      }, this.config.contentCheckInterval);
    },
    
    checkScheduleChange: function() {
      var self = this;
      var xhr = new XMLHttpRequest();
      
      xhr.open('GET', this.config.serverUrl + '/api/screen-api/' + 
        this.config.macAddress + '/current', true);
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            
            // Schedule changed?
            if (data.schedule_id && data.schedule_id !== self.currentScheduleId) {
              console.log('[SignagePlayer] Schedule changed, reloading...');
              self.currentScheduleId = data.schedule_id;
              window.location.reload();
            }
          } catch (e) {
            console.error('[SignagePlayer] Schedule check parse error:', e.message);
          }
        }
      };
      
      xhr.send();
    }
  };
  
  // Fallback Manager
  var FallbackManager = {
    strategies: [
      // Level 1: Last known content from localStorage
      function() {
        var lastContent = localStorage.getItem('lastContent');
        if (lastContent) {
          try {
            return JSON.parse(lastContent);
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      
      // Level 2: Cached playlist
      function() {
        var cached = sessionStorage.getItem('cachedPlaylist');
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      
      // Level 3: Static fallback HTML
      function() {
        return {
          url: '/offline.html',
          duration: 300 // 5 minutes
        };
      },
      
      // Level 4: Company logo
      function() {
        return {
          url: '/fallback/aquatiq-logo.jpg',
          duration: 600 // 10 minutes
        };
      }
    ],
    
    getContent: function() {
      for (var i = 0; i < this.strategies.length; i++) {
        var content = this.strategies[i]();
        if (content) {
          console.log('[FallbackManager] Using fallback level', i + 1);
          return content;
        }
      }
      
      // Ultimate fallback
      return {
        html: '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#151F6D;color:white;font-family:Arial,sans-serif;font-size:48px;">Kontakter server...</div>',
        duration: 30
      };
    }
  };
  
  // Video Preloader
  var VideoPreloader = {
    preloaded: {},
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    
    preloadVideo: function(videoUrl, videoId) {
      if (this.preloaded[videoId]) {
        return;
      }
      
      var video = document.createElement('video');
      video.preload = 'auto';
      video.src = videoUrl;
      
      this.preloaded[videoId] = {
        element: video,
        timestamp: Date.now()
      };
      
      console.log('[VideoPreloader] Preloaded:', videoId);
      this.cleanCache();
    },
    
    cleanCache: function() {
      var now = Date.now();
      var maxAge = 30 * 60 * 1000; // 30 minutes
      
      for (var id in this.preloaded) {
        if (now - this.preloaded[id].timestamp > maxAge) {
          delete this.preloaded[id];
          console.log('[VideoPreloader] Cleaned:', id);
        }
      }
    },
    
    getPreloaded: function(videoId) {
      return this.preloaded[videoId] ? this.preloaded[videoId].element : null;
    }
  };
  
  // Auto-start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      SignagePlayer.init();
    });
  } else {
    SignagePlayer.init();
  }
  
  // Expose to global scope for debugging
  window.SignagePlayer = SignagePlayer;
  window.FallbackManager = FallbackManager;
  window.VideoPreloader = VideoPreloader;
  
})();
