[![Build status](https://img.shields.io/travis/jbrudvik/browser-extension-toggle-button.svg)](https://travis-ci.org/jbrudvik/browser-extension-toggle-button)
[![Bower version](http://img.shields.io/bower/v/browser-extension-toggle-button.svg)](https://github.com/jbrudvik/browser-extension-toggle-button)

  - [BrowserExtensionToggleButton()](#browserextensiontogglebuttonoptionsobject)
  - [BrowserExtensionToggleButton.listen()](#browserextensiontogglebuttonlisten)

## BrowserExtensionToggleButton(options:Object)

  Keeps track of browser extension "active" state, sets the browser extension
  button's icon and tooltip to reflect the state, and communicates state to
  browser tabs (format: `{ active: Boolean }`).
  
  When constructed, the browser extension is assumed to be inactive. Call
  `listen()` to listen for events.
  
  To activate, either send an activation message or click the browser
  extension's button.
  
  Parameter: options (Object):
  
  - icon (Object): Chrome: Maps "active" square icon widths to image paths, Safari: "active" image path (retina support: '@2x' version in same directory)
  - inactiveIcon (Object): Chrome: Maps "inactive" square icon widths to image paths (defaults to extension default), Safari: "inactive" image path (retina support: '@2x' version in same directory)
  - title (String): "Active" icon title
  - inactiveTitle (String): "Inactive" icon title (defaults to extension default)

## BrowserExtensionToggleButton.listen()

  Begin listening for events:
  
  - Mouse clicks on extension button
  - Extension messages to control active status (format: `{ active: Boolean }`)
  - Page loads (and other tab updates) to reactivate extension in tabs when active

# Development

## Generate documentation

    $ npm install -g dox
    $ ./generate-docs > README.md

## Deploy

Where X.Y.Z is the new version number:

    $ git tag -a vX.Y.Z
    $ git push --tags
