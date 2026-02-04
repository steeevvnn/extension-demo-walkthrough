/**
 * Demo Guide - Script Data
 * Contains the demo step definitions for Salesforce Lightning walkthrough
 *
 * Each step includes:
 * - id: Unique identifier
 * - title: Short step title
 * - instructions: What to click/do
 * - talkTrack: What to say to the prospect
 * - selector: Primary CSS selector for target element
 * - fallbackSelectors: Array of alternative selectors if primary fails
 * - waitForNavigation: If true, expect URL change after action
 */

// eslint-disable-next-line no-unused-vars
const DEMO_GUIDE_STEPS = [
  {
    id: 'step-app-launcher',
    title: 'Open App Launcher',
    instructions: 'Click the App Launcher icon (9-dot grid) in the top-left corner.',
    talkTrack: 'Salesforce uses an App Launcher to provide quick access to all your applications. This unified interface allows your team to switch between Sales, Service, Marketing, and custom apps seamlessly.',
    selector: 'button.slds-global-header__button_icon.slds-global-header__button--app-launcher',
    fallbackSelectors: [
      'div.appLauncher button',
      '[data-aura-class="forceHeaderButton"]',
      '.slds-icon-waffle',
      'one-app-launcher-header button',
      '.appLauncher .slds-button'
    ],
    waitForNavigation: false
  },
  {
    id: 'step-search-sales',
    title: 'Search for Sales App',
    instructions: 'In the App Launcher search box, type "Sales" to filter applications.',
    talkTrack: 'The search functionality makes it easy to find any app instantly. For a sales team managing hundreds of accounts, this quick navigation saves valuable time during busy workdays.',
    selector: 'input.slds-input[placeholder*="Search"]',
    fallbackSelectors: [
      'one-app-launcher-modal input[type="search"]',
      '.appLauncherMenu input',
      'input[placeholder*="apps and items"]',
      '.slds-modal input.slds-input',
      '[data-aura-class="oneAppLauncherSearch"] input'
    ],
    waitForNavigation: false
  },
  {
    id: 'step-select-sales',
    title: 'Select Sales App',
    instructions: 'Click on the "Sales" application to open it.',
    talkTrack: 'The Sales app is your command center for managing the entire sales pipeline. It brings together leads, accounts, contacts, and opportunities in one cohesive workspace designed to accelerate deal closure.',
    selector: 'one-app-launcher-menu-item a[data-label="Sales"]',
    fallbackSelectors: [
      'a.appTileTitle[title="Sales"]',
      '.slds-app-launcher__tile[data-name="Sales"]',
      'one-app-launcher-modal a[data-name="Sales"]',
      'lightning-formatted-rich-text[data-app-name="Sales"]',
      '.appTile[data-name="standard-Sales"]'
    ],
    waitForNavigation: true
  },
  {
    id: 'step-accounts-tab',
    title: 'Navigate to Accounts',
    instructions: 'Click the "Accounts" tab in the navigation bar.',
    talkTrack: 'The Accounts object is the foundation of your customer relationships in Salesforce. Every contact, opportunity, and case connects back to an account, giving you a complete 360-degree view of each customer.',
    selector: 'a[title="Accounts"]',
    fallbackSelectors: [
      'one-app-nav-bar-item-root a[title="Accounts"]',
      'li.slds-nav-bar__item a[title="Accounts"]',
      'span.slds-truncate[title="Accounts"]',
      '[data-id="Account"] a',
      'a.slds-context-bar__label-action[title="Accounts"]'
    ],
    waitForNavigation: true
  },
  {
    id: 'step-first-account',
    title: 'Open First Account',
    instructions: 'Click on the first account name in the list to view its details.',
    talkTrack: 'Let\'s dive into a specific account to see the depth of information Salesforce captures. Notice how all the related data - contacts, opportunities, cases, and activities - is organized for quick access.',
    selector: 'table.slds-table tbody tr:first-child th a',
    fallbackSelectors: [
      'lightning-datatable tbody tr:first-child a[data-refid="recordId"]',
      'lst-list-view-manager-header + div table tbody tr:first-child a',
      '.slds-table--bordered tbody tr:first-child th a',
      'table[data-aura-class="uiVirtualDataTable"] tbody tr:first-child a',
      'lightning-formatted-url a[target="_blank"]'
    ],
    waitForNavigation: true
  },
  {
    id: 'step-account-details',
    title: 'View Account Details',
    instructions: 'Review the Details tab showing key account information.',
    talkTrack: 'The Details tab surfaces the most critical account information - industry, revenue, employee count, and custom fields your organization has added. This data drives intelligent automation and reporting across your org.',
    selector: 'a[data-tab-name="detailTab"]',
    fallbackSelectors: [
      'li.slds-tabs_default__item a[title="Details"]',
      'lightning-tab-bar a[data-tab-value="detailTab"]',
      'a.slds-tabs_default__link[title="Details"]',
      '[data-target-selection-name="sfdc:Tab.sfa:Account.detailTab"]',
      'ul[role="tablist"] li:nth-child(2) a'
    ],
    waitForNavigation: false
  },
  {
    id: 'step-related-tab',
    title: 'Explore Related Records',
    instructions: 'Click the "Related" tab to see all related records and objects.',
    talkTrack: 'The Related tab is where the power of Salesforce\'s relational database shines. From here, you can see all contacts, opportunities, cases, and even custom objects linked to this account - no clicking through multiple screens.',
    selector: 'a[data-tab-name="relatedListsTab"]',
    fallbackSelectors: [
      'li.slds-tabs_default__item a[title="Related"]',
      'lightning-tab-bar a[data-tab-value="relatedListsTab"]',
      'a.slds-tabs_default__link[title="Related"]',
      '[data-target-selection-name="sfdc:Tab.sfa:Account.relatedListsTab"]',
      'ul[role="tablist"] li:nth-child(3) a'
    ],
    waitForNavigation: false
  },
  {
    id: 'step-opportunities-related',
    title: 'View Opportunities',
    instructions: 'Locate the Opportunities related list and click "View All" to see all opportunities.',
    talkTrack: 'Opportunities represent your active deals in progress. Salesforce tracks every stage of the sales cycle, giving managers visibility into pipeline health and enabling accurate forecasting for leadership.',
    selector: 'article[aria-label*="Opportunities"] a.slds-card__header-link',
    fallbackSelectors: [
      'lst-related-list-single-container[data-target="Opportunities"] a',
      'article.forceRelatedListCardDesktop a[title="Opportunities"]',
      'span[title="Opportunities"]',
      'div.slds-card[data-target="Opportunities"] a.slds-card__header-link',
      'force-record-layout-section article:has(span[title="Opportunities"]) a'
    ],
    waitForNavigation: true
  }
];
