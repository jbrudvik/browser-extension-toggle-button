/* global chrome:false, safari:false */

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
   * - icon (Object): Chrome: Maps "active" square icon widths to image paths, Safari: "active" image path (retina support: '@2x' version in same directory)
   * - inactiveIcon (Object): Chrome: Maps "inactive" square icon widths to image paths (defaults to extension default), Safari: "inactive" image path (retina support: '@2x' version in same directory)
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
    } else if (this.isSafari) {
      var toolbarItem = safari.extension.toolbarItems[0];
      if (options.icon) {
        this.icon = {
          true: safari.extension.baseURI + options.icon,
          false: options.inactiveIcon ? (safari.extension.baseURI + options.inactiveIcon) : (toolbarItem ? toolbarItem.image : undefined)
        };
      }
      if (options.title) {
        this.title = {
          true: options.title,
          false: options.inactiveTitle || (toolbarItem ? toolbarItem.toolTip : undefined)
        };
      }
    }

    this.setActive = function(active, callback) {
      this.active = (active !== undefined) ? active : true;
      this.setButtonActive(this.active);
      this.setTabsActive(this.active, callback);
    };

    this.toggleActive = function() {
      this.setActive(!this.active);
    };

    this.reactivateButtonIfNeeded = function() {
      if (this.active) {
        this.setButtonActive(this.active);
      }
    };

    this.reactivateTabIfNeeded = function(target) {
      var tab;
      if (this.isChrome) {
        tab = target;
      } else if (this.isSafari) {
        tab = target.target;
      }
      if (tab !== undefined && this.active) {
        this.setTabActive(tab);
      }
    };

    this.setButtonActive = function(active) {
      this.active = (active !== undefined) ? active : true;

      if (this.isChrome) {
        if (this.icon) chrome.browserAction.setIcon({ path: this.icon[active] });
        if (this.title) chrome.browserAction.setTitle({ title: this.title[active] });
      } else if (this.isSafari) {
        if (active && !this.icon[false]) this.icon[false] = safari.extension.toolbarItems[0].image;
        if (active && !this.title[false]) this.title[false] = safari.extension.toolbarItems[0].toolTip;

        var icon = this.icon ? this.icon[active] : undefined;
        var title = this.title ? this.title[active] : undefined;

        for (var i = 0; i < safari.extension.toolbarItems.length; i++) {
          var toolbarItem = safari.extension.toolbarItems[i];
          if (icon) toolbarItem.image = icon;
          if (title) toolbarItem.toolTip = title;
        }
      }
    };

    this.setTabActive = function(tab, active) {
      if (active === undefined) active = true;

      if (this.isChrome) {
        chrome.tabs.sendMessage(tab, { active: active });
      } else if (this.isSafari) {
        if (tab && tab.page && tab.page.dispatchMessage) {
          tab.page.dispatchMessage('active', active);
        }
      }
    };

    this.setTabsActive = function(active, callback) {
      this.active = (active !== undefined) ? active : true;

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
            this.setTabActive(tab, active);
          }
        }
        if (callback) callback();
      }
    };

    this.handleActivationMessage = function(message) {
      var active;
      if (this.isChrome) {
        active = !!message.active;
      } else if (this.isSafari) {
        active = message.message;
      }
      if (active !== undefined) {
        this.setActive(active);
      }
    };

    this.setActive(this.active);
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
      safari.application.addEventListener('message', this.handleActivationMessage.bind(this), false);
      safari.application.addEventListener('navigate', this.reactivateTabIfNeeded.bind(this), false);
      safari.application.addEventListener('open', this.reactivateButtonIfNeeded.bind(this), true);
    }
  };

  window.BrowserExtensionToggleButton = BrowserExtensionToggleButton;

})(this);
