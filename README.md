# Demo Guide - Salesforce Lightning Extension

A production-ready Chrome extension that provides step-by-step guidance overlays for Salesforce Lightning demos.

## Features

- **Step-by-step guidance** with title, instructions, and talk track
- **Visual highlighting** of target elements with smooth scrolling
- **SPA-aware navigation** detection for Salesforce Lightning
- **Dynamic DOM handling** with MutationObserver and retry logic
- **Persistent state** across page navigations
- **Fallback selectors** for robust element finding
- **Clean resource management** to prevent memory leaks

## File Structure

```
extension-demo-walkthrough/
├── manifest.json       # MV3 extension configuration
├── background.js       # Service worker for icon click handling
├── contentScript.js    # Main runtime logic (overlay, highlighting, observers)
├── scriptData.js       # Demo step definitions
├── overlay.css         # Namespaced styles (dg- prefix)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## How to Load & Test

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this extension directory
5. The "Demo Guide" extension will appear in your extensions list

### 2. Test on Salesforce

1. Navigate to any Salesforce Lightning org (`*.lightning.force.com` or `*.my.salesforce.com`)
2. Click the Demo Guide extension icon in the Chrome toolbar
3. The overlay panel will appear in the bottom-right corner
4. Follow the steps - the extension will:
   - Highlight target elements on the page
   - Retry finding elements if they're not immediately available
   - Persist your progress across page navigations

### 3. Navigation Controls

- **Previous/Next**: Navigate between steps
- **Minimize**: Collapse the panel (highlight remains visible)
- **Close**: Hide the overlay completely
- Progress is saved automatically and restored on re-open

## Customizing Demo Steps

Edit `scriptData.js` to customize the demo steps. Each step supports:

```javascript
{
  id: 'unique-step-id',
  title: 'Step Title',
  instructions: 'What to click or do',
  talkTrack: 'What to say to the prospect',
  selector: 'primary.css.selector',
  fallbackSelectors: [
    'alternative.selector.1',
    'alternative.selector.2'
  ],
  waitForNavigation: true  // Set true if action causes page navigation
}
```

## Technical Notes

### Salesforce Lightning Compatibility

- **SPA Navigation**: Intercepts `pushState`, `replaceState`, and `popstate` events
- **Dynamic DOM**: Uses MutationObserver with 200ms debouncing
- **Element Retry**: 300ms intervals for up to 5 seconds
- **Cleanup**: All observers, timers, and listeners are cleaned up on close

### CSS Namespacing

All CSS classes are prefixed with `dg-` to avoid conflicts with Salesforce's styles.

### Permissions

- `activeTab`: Required for injecting content scripts
- `storage`: Persists current step progress
- Host permissions limited to Salesforce domains only

## Troubleshooting

### Element Not Found

If an element isn't being found:
1. Check you're on the correct Salesforce page
2. The step may require navigation first
3. Selectors may need updating for your specific Salesforce org

### Overlay Not Appearing

1. Ensure you're on a `*.lightning.force.com` or `*.my.salesforce.com` URL
2. Check the browser console for errors
3. Try reloading the page and clicking the extension icon again

### Duplicate Overlays

The extension prevents duplicate injection, but if issues occur:
1. Close the overlay
2. Refresh the page
3. Click the extension icon again

## License

MIT License
