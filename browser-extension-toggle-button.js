
(function(window, undefined) {

  /**
   * Keeps track of browser extension "active" state, sets the browser extension
   * button's icon and tooltip to reflect the state, and communicates state to
   * browser tabs (format: `{ active: Boolean }`).
   *
   * When constructed, the browser extension is assumed to be inactive. Call
   * `listen()` to listen for events.
   *
   * To activate, either send an activation message or click the browser
   * extension's button.
   *
   * Parameter: options (Object):
   *
   * - icon (Object): Maps "active" square icon widths to image paths
   * - inactiveIcon (Object): Maps "inactive" square icon widths to image paths (defaults to extension default)
   * - title (String): "Active" icon title
   * - inactiveTitle (String): "Inactive" icon title (defaults to extension default)
   *
   * @param {Object} options
   */
  function BrowserExtensionToggleButton(options) {
    options = options || {};

    // Browser context
    this.isChrome = typeof chrome !== 'undefined';
    this.isSafari = typeof safari !== 'undefined';

    // Inactive by default
    this.active = false;

    if (this.isChrome) {
      if (options.icon) {
        this.icon = {
          true: options.icon,
          false: options.inactiveIcon || chrome.runtime.getManifest().browser_action.default_icon
        };
      }

      if (options.title) {
        this.title = {
          true: options.title,
          false: options.inactiveTitle || chrome.runtime.getManifest().browser_action.default_title
        };
      }
    }

    this.setActive = function(active, callback) {
      this.active = (active !== undefined) ? active : true;

      if (this.isChrome) {
        if (this.icon) chrome.browserAction.setIcon({ path: this.icon[active] });
        if (this.title) chrome.browserAction.setTitle({ title: this.title[active] });
      }

      this.setTabsActive(this.active, callback);
    };

    this.toggleActive = function() {
      this.setActive(!this.active);
    };

    this.reactivateTabIfNeeded = function(tabId) {
      if (this.active) {
        this.setTabActive(tabId, true);
      }
    };

    this.setTabActive = function(tabId, active) {
      if (this.isChrome) {
        chrome.tabs.sendMessage(tabId, { active: active });
      } else if (this.isSafari) {

      }
    };

    this.setTabsActive = function(active, callback) {
      if (this.isChrome) {
        var self = this;
        chrome.tabs.query({}, function(tabs) {
          for (var i = 0; i < tabs.length; i++) {
            self.setTabActive(tabs[i].id, active);
          }
          if (callback) callback();
        });
      } else if (this.isSafari) {
        var windows = safari.application.browserWindows;
        for (var i = 0; i < windows.length; i++) {
          var tabs = windows[i].tabs;
          for (var j = 0; j < tabs.length; j++) {
            var tab = tabs[j];
            if (tab && tab.page && tab.page.dispatchMessage) {
              tab.page.dispatchMessage('toggle');
            }
          }
        }
      }
    };

    this.handleActivationMessage = function(message) {
      this.setActive(!!message.active);
    };
  }

  /**
   * Begin listening for events:
   *
   * - Mouse clicks on extension button
   * - Extension messages to control active status (format: `{ active: Boolean }`)
   * - Page loads (and other tab updates) to reactivate extension in tabs when active
   */
  BrowserExtensionToggleButton.prototype.listen = function() {
    if (this.isChrome) {
      chrome.browserAction.onClicked.addListener(this.toggleActive.bind(this));
      chrome.runtime.onMessage.addListener(this.handleActivationMessage.bind(this));
      chrome.tabs.onUpdated.addListener(this.reactivateTabIfNeeded.bind(this));
    } else if (this.isSafari) {
      safari.application.addEventListener('command', this.toggleActive.bind(this), false);
    }
  };

  window.BrowserExtensionToggleButton = BrowserExtensionToggleButton;

})(this);
