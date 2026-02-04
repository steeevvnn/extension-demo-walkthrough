/**
 * Demo Guide - Content Script
 * Handles overlay rendering, step navigation, element highlighting,
 * SPA navigation detection, and dynamic DOM handling for Salesforce Lightning
 */

(function() {
  'use strict';

  // ============================================
  // CONSTANTS & STATE
  // ============================================

  const ROOT_ID = 'demo-guide-root';
  const ELEMENT_RETRY_INTERVAL = 300; // ms between retries
  const ELEMENT_RETRY_TIMEOUT = 5000; // total time to search
  const MUTATION_DEBOUNCE = 200; // ms debounce for MutationObserver

  // Global state
  const state = {
    isVisible: false,
    isMinimized: false,
    currentStepIndex: 0,
    steps: typeof DEMO_GUIDE_STEPS !== 'undefined' ? DEMO_GUIDE_STEPS : [],
    elementRetryTimer: null,
    elementRetryStartTime: null,
    mutationObserver: null,
    mutationDebounceTimer: null,
    currentHighlightedElement: null,
    lastUrl: window.location.href,
    resizeObserver: null,
    scrollHandler: null,
    historyListenerAdded: false
  };

  // ============================================
  // SVG ICONS
  // ============================================

  const ICONS = {
    guide: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    minimize: `<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>`,
    expand: `<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>`,
    prev: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    next: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    action: `<svg viewBox="0 0 24 24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>`,
    talk: `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`,
    found: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    notFound: `<svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>`
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function log(message, ...args) {
    console.log(`[Demo Guide] ${message}`, ...args);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ============================================
  // STORAGE HELPERS
  // ============================================

  async function loadSavedStep() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStoredStep' });
      if (response && typeof response.stepIndex === 'number') {
        state.currentStepIndex = Math.min(response.stepIndex, state.steps.length - 1);
        state.currentStepIndex = Math.max(0, state.currentStepIndex);
      }
    } catch (error) {
      log('Error loading saved step:', error);
    }
  }

  async function saveCurrentStep() {
    try {
      await chrome.runtime.sendMessage({
        action: 'saveStep',
        stepIndex: state.currentStepIndex
      });
    } catch (error) {
      log('Error saving step:', error);
    }
  }

  async function clearSavedStep() {
    try {
      await chrome.runtime.sendMessage({ action: 'clearStep' });
    } catch (error) {
      log('Error clearing step:', error);
    }
  }

  // ============================================
  // ELEMENT FINDING WITH RETRIES
  // ============================================

  function findElement(step) {
    if (!step) return null;

    // Try primary selector
    let element = document.querySelector(step.selector);
    if (element && isElementVisible(element)) {
      return element;
    }

    // Try fallback selectors
    if (step.fallbackSelectors && step.fallbackSelectors.length > 0) {
      for (const fallback of step.fallbackSelectors) {
        element = document.querySelector(fallback);
        if (element && isElementVisible(element)) {
          return element;
        }
      }
    }

    return null;
  }

  function isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  function cancelElementRetry() {
    if (state.elementRetryTimer) {
      clearInterval(state.elementRetryTimer);
      state.elementRetryTimer = null;
    }
    state.elementRetryStartTime = null;
  }

  function startElementRetry(callback) {
    cancelElementRetry();
    state.elementRetryStartTime = Date.now();

    const attemptFind = () => {
      const step = state.steps[state.currentStepIndex];
      const element = findElement(step);

      if (element) {
        cancelElementRetry();
        callback(element, 'found');
        return;
      }

      const elapsed = Date.now() - state.elementRetryStartTime;
      if (elapsed >= ELEMENT_RETRY_TIMEOUT) {
        cancelElementRetry();
        callback(null, 'not_found');
        return;
      }

      callback(null, 'searching');
    };

    // Immediate first attempt
    attemptFind();

    // Set up interval for retries
    state.elementRetryTimer = setInterval(attemptFind, ELEMENT_RETRY_INTERVAL);
  }

  // ============================================
  // HIGHLIGHTING
  // ============================================

  function clearHighlight() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    const existingBox = root.querySelector('.dg-highlight-box');
    const existingArrow = root.querySelector('.dg-highlight-arrow');
    if (existingBox) existingBox.remove();
    if (existingArrow) existingArrow.remove();
    state.currentHighlightedElement = null;
  }

  function highlightElement(element) {
    clearHighlight();

    if (!element) return;

    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    state.currentHighlightedElement = element;

    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Wait for scroll to complete before positioning highlight
    setTimeout(() => {
      updateHighlightPosition();
    }, 300);
  }

  function updateHighlightPosition() {
    const element = state.currentHighlightedElement;
    const root = document.getElementById(ROOT_ID);
    if (!element || !root || !state.isVisible) return;

    // Check if element still exists in DOM
    if (!document.body.contains(element)) {
      clearHighlight();
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 6;

    // Remove existing highlight elements
    const existingBox = root.querySelector('.dg-highlight-box');
    const existingArrow = root.querySelector('.dg-highlight-arrow');
    if (existingBox) existingBox.remove();
    if (existingArrow) existingArrow.remove();

    // Create highlight box
    const highlightBox = document.createElement('div');
    highlightBox.className = 'dg-highlight-box';
    highlightBox.style.cssText = `
      left: ${rect.left + window.scrollX - padding}px;
      top: ${rect.top + window.scrollY - padding}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
    `;
    root.appendChild(highlightBox);

    // Create pointing arrow above the element
    const arrow = document.createElement('div');
    arrow.className = 'dg-highlight-arrow';
    arrow.innerHTML = ICONS.arrow;
    arrow.style.cssText = `
      left: ${rect.left + window.scrollX + rect.width / 2 - 20}px;
      top: ${rect.top + window.scrollY - 50}px;
    `;
    root.appendChild(arrow);
  }

  // ============================================
  // OVERLAY RENDERING
  // ============================================

  function createOverlayHTML() {
    const step = state.steps[state.currentStepIndex];
    const stepNumber = state.currentStepIndex + 1;
    const totalSteps = state.steps.length;
    const progressPercent = ((stepNumber) / totalSteps) * 100;
    const isFirstStep = state.currentStepIndex === 0;
    const isLastStep = state.currentStepIndex === state.steps.length - 1;

    return `
      <div class="dg-overlay-panel ${state.isMinimized ? 'dg-overlay-panel--minimized' : ''}">
        <div class="dg-header">
          <div class="dg-header-title">
            <span class="dg-header-icon">${ICONS.guide}</span>
            <span>Demo Guide</span>
          </div>
          <div style="display: flex; align-items: center;">
            <button class="dg-minimize-btn" data-action="minimize" title="${state.isMinimized ? 'Expand' : 'Minimize'}">
              ${state.isMinimized ? ICONS.expand : ICONS.minimize}
            </button>
            <button class="dg-close-btn" data-action="close" title="Close">
              ${ICONS.close}
            </button>
          </div>
        </div>
        <div class="dg-progress">
          <div class="dg-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
        <div class="dg-content">
          <div class="dg-step-counter">Step ${stepNumber} of ${totalSteps}</div>
          <h2 class="dg-step-title">${escapeHtml(step.title)}</h2>

          <div class="dg-section">
            <div class="dg-section-label">
              ${ICONS.action}
              <span>Action</span>
            </div>
            <div class="dg-instructions">${escapeHtml(step.instructions)}</div>
          </div>

          <div class="dg-section">
            <div class="dg-section-label">
              ${ICONS.talk}
              <span>Talk Track</span>
            </div>
            <div class="dg-talk-track">${escapeHtml(step.talkTrack)}</div>
          </div>

          <div class="dg-element-status dg-element-status--searching" id="dg-element-status">
            <div class="dg-spinner"></div>
            <span>Searching for target element...</span>
          </div>
        </div>
        <div class="dg-footer">
          <button class="dg-nav-btn dg-nav-btn--prev" data-action="prev" ${isFirstStep ? 'disabled' : ''}>
            ${ICONS.prev}
            <span>Previous</span>
          </button>
          <button class="dg-nav-btn ${isLastStep ? 'dg-nav-btn--finish' : 'dg-nav-btn--next'}" data-action="${isLastStep ? 'finish' : 'next'}">
            <span>${isLastStep ? 'Finish' : 'Next'}</span>
            ${isLastStep ? ICONS.check : ICONS.next}
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function updateElementStatus(status, element) {
    const statusEl = document.getElementById('dg-element-status');
    if (!statusEl) return;

    if (status === 'found') {
      statusEl.className = 'dg-element-status dg-element-status--found';
      statusEl.innerHTML = `${ICONS.found}<span>Target element found and highlighted</span>`;
    } else if (status === 'searching') {
      statusEl.className = 'dg-element-status dg-element-status--searching';
      statusEl.innerHTML = `<div class="dg-spinner"></div><span>Searching for target element...</span>`;
    } else if (status === 'not_found') {
      statusEl.className = 'dg-element-status dg-element-status--not-found';
      statusEl.innerHTML = `${ICONS.notFound}<span>Element not found. Navigate to the correct page or proceed manually.</span>`;
    }
  }

  function renderOverlay() {
    let root = document.getElementById(ROOT_ID);

    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    root.innerHTML = createOverlayHTML();
    attachEventListeners();

    // Start searching for element
    startElementRetry((element, status) => {
      updateElementStatus(status, element);
      if (element) {
        highlightElement(element);
      }
    });
  }

  function attachEventListeners() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    // Use event delegation
    root.addEventListener('click', handleOverlayClick);
  }

  function handleOverlayClick(event) {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    switch (action) {
      case 'close':
        hideOverlay();
        break;
      case 'minimize':
        toggleMinimize();
        break;
      case 'prev':
        goToPreviousStep();
        break;
      case 'next':
        goToNextStep();
        break;
      case 'finish':
        finishDemo();
        break;
    }
  }

  // ============================================
  // NAVIGATION ACTIONS
  // ============================================

  function goToPreviousStep() {
    if (state.currentStepIndex > 0) {
      cancelElementRetry();
      clearHighlight();
      state.currentStepIndex--;
      saveCurrentStep();
      renderOverlay();
    }
  }

  function goToNextStep() {
    if (state.currentStepIndex < state.steps.length - 1) {
      cancelElementRetry();
      clearHighlight();
      state.currentStepIndex++;
      saveCurrentStep();
      renderOverlay();
    }
  }

  function finishDemo() {
    clearSavedStep();
    state.currentStepIndex = 0;
    hideOverlay();
    log('Demo completed!');
  }

  function toggleMinimize() {
    state.isMinimized = !state.isMinimized;
    renderOverlay();
    if (state.isMinimized) {
      clearHighlight();
    }
  }

  // ============================================
  // SHOW/HIDE OVERLAY
  // ============================================

  async function showOverlay() {
    if (state.isVisible) return;

    await loadSavedStep();
    state.isVisible = true;
    state.isMinimized = false;
    renderOverlay();
    setupObservers();
    setupSPANavigation();
    log('Overlay shown, step:', state.currentStepIndex + 1);
  }

  function hideOverlay() {
    state.isVisible = false;
    cancelElementRetry();
    clearHighlight();
    cleanupObservers();

    const root = document.getElementById(ROOT_ID);
    if (root) {
      root.remove();
    }

    log('Overlay hidden');
  }

  function toggleOverlay() {
    if (state.isVisible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  }

  // ============================================
  // SPA NAVIGATION DETECTION
  // ============================================

  function setupSPANavigation() {
    if (state.historyListenerAdded) return;

    // Intercept pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleNavigation();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleNavigation();
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleNavigation);

    state.historyListenerAdded = true;
    log('SPA navigation detection enabled');
  }

  const handleNavigation = debounce(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== state.lastUrl) {
      log('Navigation detected:', currentUrl);
      state.lastUrl = currentUrl;

      if (state.isVisible && !state.isMinimized) {
        // Re-run element search on navigation
        cancelElementRetry();
        clearHighlight();
        startElementRetry((element, status) => {
          updateElementStatus(status, element);
          if (element) {
            highlightElement(element);
          }
        });
      }
    }
  }, 200);

  // ============================================
  // MUTATION OBSERVER FOR DOM CHANGES
  // ============================================

  function setupObservers() {
    // MutationObserver for DOM changes
    if (state.mutationObserver) {
      state.mutationObserver.disconnect();
    }

    state.mutationObserver = new MutationObserver(
      debounce(() => {
        if (!state.isVisible || state.isMinimized) return;

        // If we have a highlighted element, check if it's still valid
        if (state.currentHighlightedElement) {
          if (!document.body.contains(state.currentHighlightedElement)) {
            // Element was removed, search again
            log('Highlighted element removed, re-searching');
            clearHighlight();
            startElementRetry((element, status) => {
              updateElementStatus(status, element);
              if (element) {
                highlightElement(element);
              }
            });
          } else {
            // Update position in case it moved
            updateHighlightPosition();
          }
        }
      }, MUTATION_DEBOUNCE)
    );

    state.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Scroll handler to update highlight position
    state.scrollHandler = debounce(() => {
      if (state.currentHighlightedElement && state.isVisible && !state.isMinimized) {
        updateHighlightPosition();
      }
    }, 50);
    window.addEventListener('scroll', state.scrollHandler, true);

    // Resize observer for window resize
    window.addEventListener('resize', state.scrollHandler);

    log('Observers set up');
  }

  function cleanupObservers() {
    if (state.mutationObserver) {
      state.mutationObserver.disconnect();
      state.mutationObserver = null;
    }

    if (state.scrollHandler) {
      window.removeEventListener('scroll', state.scrollHandler, true);
      window.removeEventListener('resize', state.scrollHandler);
      state.scrollHandler = null;
    }

    if (state.mutationDebounceTimer) {
      clearTimeout(state.mutationDebounceTimer);
      state.mutationDebounceTimer = null;
    }

    log('Observers cleaned up');
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleOverlay') {
      toggleOverlay();
      sendResponse({ success: true, isVisible: state.isVisible });
    }
    return true;
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    // Check if already initialized (prevent double injection)
    if (window.__DEMO_GUIDE_INITIALIZED__) {
      log('Already initialized, skipping');
      return;
    }
    window.__DEMO_GUIDE_INITIALIZED__ = true;

    // Validate steps are loaded
    if (!state.steps || state.steps.length === 0) {
      console.error('[Demo Guide] No steps loaded! Check scriptData.js');
      return;
    }

    log('Initialized with', state.steps.length, 'steps');
  }

  // Run initialization
  init();

})();
