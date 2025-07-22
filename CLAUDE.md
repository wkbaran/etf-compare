# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based ETF (Exchange-Traded Fund) holdings comparison tool built with vanilla JavaScript and Web Components. The application allows users to paste ETF holdings data, map columns, and compare multiple ETFs side-by-side to analyze overlaps and personal investment allocations.

## Development Commands

### Running the Application
```bash
# Serve locally with Python (recommended for development)
python3 -m http.server 8000

# Or with Node.js if available
npx http-server

# Or simply open in browser (may have CORS limitations)
open index.html
```

### Testing
```bash
# No formal test runner - testing is manual via browser
# Open browser developer tools and test with various data formats
# Primary testing is done through the manual checklist in this file
```

### Code Quality
```bash
# No formal linting - uses vanilla JavaScript
# Follow existing code style patterns in components.js and utils.js
```

## Commit Message Guidelines

### Focus on End Results
- Write commit messages that describe what users get, not the development process
- Don't mention failed attempts, rework, or intermediate steps
- Focus on the final delivered functionality

### Avoid Implementation Details
- Don't describe styling details that are obvious or consistent with existing patterns
- Don't mention hover behavior, dark mode support, or other UI consistency features
- Assume reviewers understand standard implementation practices

### Be Specific About Features
- Clearly state the actual capabilities being added
- Reference the GitHub issue being resolved
- Keep descriptions focused on user-facing functionality

### Example Structure
```
Brief title describing the main feature

- Bullet point of key capability 1
- Bullet point of key capability 2
- Documentation updates if applicable

Resolves #XX
```

### What to Avoid
- "Add proper styling" (assumed)
- "Implement hover behavior" (implementation detail)
- "Remove redundant code" (development process)
- Multiple issue resolution in one commit (unless truly related)

## Architecture & Technology Stack

### Core Technologies
- **HTML5**: Semantic markup with custom elements
- **CSS3**: Custom properties for theming, Grid/Flexbox layouts
- **Vanilla JavaScript**: ES6+ features, Web Components API
- **LocalStorage**: Client-side data persistence

### Key Design Principles
- **No Framework Dependencies**: Built with pure web standards
- **Component-Based**: Modular web components for reusability
- **Responsive Design**: Mobile-first approach with CSS Grid
- **Accessibility**: Semantic HTML, proper ARIA labels, keyboard navigation

## Core Architecture Patterns

### Three-Component System
The application is built around three main Web Components that communicate via custom events:

1. **ETFTabsManager** (`components.js:1-150`) - Root component managing tab state and persistence
2. **ETFInputSection** (`components.js:151-350`) - Handles data entry and column mapping
3. **ETFComparisonView** (`components.js:351-end`) - Renders comparison tables and overlap analysis

### State Management Flow
```
ETFTabsManager (localStorage) 
    ↓ custom events
ETFInputSection (data parsing)
    ↓ etf-added event  
ETFComparisonView (rendering)
```

### Component Communication
- Components communicate via bubbling custom events (`etf-added`, `etf-removed`)
- ETFTabsManager acts as the single source of truth for all tab/ETF data
- Each component re-renders completely when data changes (no virtual DOM)

### Critical Implementation Details

#### Data Parsing Architecture (`components.js:ETFInputSection`)
The column detection system uses regex patterns to automatically identify:
- **Ticker columns**: `/^[A-Z]{1,5}$/` for stock symbols
- **Percentage columns**: `/%/` and numeric validation
- **Description columns**: Text fields for company names

Data parsing handles multiple formats via `detectColumns()` method that analyzes first 5 rows to determine structure.

#### LocalStorage Schema
```javascript
// Tab structure in localStorage['etf-tabs']
{
  id: "tab123456789",     // timestamp-based unique ID
  name: "Tech ETFs",      // user-editable name
  etfs: [ETFObject...]    // array of ETF data
}

// ETF structure within each tab
{
  name: "CIBR",
  totalValue: 2000000000,
  displayValue: "$2B",    // formatted display
  myInvestment: 5000,
  holdings: [{ticker, amount, description}...]
}
```

#### Theme System (`utils.js`)
- CSS custom properties in `styles.css` define all theme variables
- `toggleTheme()` function switches `data-theme` attribute on `<body>`
- Theme preference persisted in `localStorage['theme']`

#### State Management Architecture (`components.js:ETFComparisonView`)
- **Sort State**: `etfSortState = {etfIndex: 'ticker'|'weight'}` tracks per-ETF sorting
- **Collapse State**: `etfCollapseState = {etfKey: boolean}` persists to localStorage separately
- **ETF Key Strategy**: Uses ETF name as key for persistence across reorders
- **Hover Controls**: CSS `:hover` selectors target `.etf-header` for clean UI

#### Overlap Detection Enhancement (`components.js:isValidTickerForOverlap`)
- **Validation Logic**: `/[A-Z0-9]/.test(firstChar)` ensures tickers start with alphanumeric
- **Exclusion Patterns**: Filters 'CASH', 'N/A', dashes, and INDEX-containing strings
- **Performance**: Set-based intersection for efficient duplicate detection

## Data Model

### ETF Object Structure
```javascript
{
  name: "CIBR",                    // ETF ticker/name
  displayName: "iShares Cybersecurity", // Optional display name
  totalValue: 2000000000,          // Total ETF value in USD
  displayValue: "$2B",             // Formatted display string
  myInvestment: 5000,              // User's personal investment
  holdings: [                      // Array of individual holdings
    {
      ticker: "AAPL",              // Stock ticker
      amount: 5.2,                 // Percentage of ETF
      description: "Apple Inc"      // Optional company name
    }
  ]
}
```

### Tab Object Structure
```javascript
{
  id: "tab123456789",              // Unique timestamp-based ID
  name: "Tech ETFs",               // User-editable tab name
  etfs: []                         // Array of ETF objects
}
```

## Key Features & Implementation

### 1. Data Import & Processing
- **Column Detection**: Regex patterns for ticker, percentage, description columns
- **Data Parsing**: Handles tab-separated, space-separated, and mixed formats
- **Validation**: Filters out cash positions, index entries, invalid data
- **Error Handling**: User-friendly error messages for parsing failures

### 2. Financial Calculations
- **Personal Positions**: `myInvestment * (holdingPercentage / 100)`
- **ETF Total Values**: Supports millions (M) and billions (B) notation
- **Smart Formatting**: Automatic K/M/B formatting based on value size
- **Precision Handling**: Proper decimal handling for small amounts

### 3. Overlap Analysis
- **Detection Algorithm**: Set intersection across all ETF holdings
- **Visual Highlighting**: Yellow background for overlapping holdings
- **Statistics**: Total unique, overlapping count, percentage calculations
- **Intelligent Filtering**: Excludes invalid tickers (cash, placeholders, symbols starting with non-alphanumeric characters)

### 4. Theme System
- **CSS Custom Properties**: Complete variable-based theming
- **Dark/Light Modes**: Toggle with persistent localStorage preference
- **Component Theming**: All components respect theme variables
- **Smooth Transitions**: 0.3s ease transitions for theme switching

### 5. Data Persistence
- **LocalStorage**: JSON serialization of complete application state
- **Import/Export**: File-based backup/restore with JSON format
- **Migration**: Automatic upgrade from single-tab to multi-tab format
- **Error Recovery**: Graceful handling of corrupted localStorage data

### 6. ETF Management & Sorting
- **Per-ETF Sorting**: Independent sorting controls for each ETF (ticker A-Z or weight %)
- **Sort State Persistence**: Individual sort preferences maintained per ETF column
- **Sort Controls**: Subtle arrow buttons (↑A-Z, ↓%) that appear based on current sort state
- **ETF Reordering**: Left/right arrow controls for repositioning ETFs in comparison view

### 7. UI State Management
- **Collapsible Holdings**: Expand/collapse ETF holdings lists with persistent state
- **Display Names**: Optional descriptive names shown below ETF tickers
- **Hover Controls**: Interactive buttons only visible when hovering over ETF headers
- **Tab Close Confirmation**: Prevents accidental data loss when closing tabs with ETFs

### 8. ETF Operations
- **ETF Removal**: Delete button (🗑️) with confirmation dialog
- **Cross-Tab Copying**: Copy ETFs between different comparison tabs
- **Smart Copy Button**: Only shows when multiple tabs exist
- **Clean State Management**: Proper cleanup of collapse states and sort preferences

## Development Patterns & Best Practices

### Web Components
```javascript
class ComponentName extends HTMLElement {
  constructor() {
    super();
    this.data = this.loadData();
    this.render();
  }
  
  connectedCallback() {
    this.setupEventListeners();
  }
  
  render() {
    this.innerHTML = `...`;
    this.setupEventListeners();
  }
}
```

### Event Handling
- **Event Delegation**: Efficient handling of dynamic content
- **Custom Events**: Component communication via bubbling events
- **Cleanup**: Proper event listener removal to prevent memory leaks

### State Management
- **Single Source of Truth**: ETFTabsManager holds all application state
- **Immutable Updates**: Create new objects rather than mutating existing
- **Reactive Updates**: Components re-render when data changes

## Common Development Tasks

### Adding New Features
1. **Identify Component**: Determine which component should own the feature
2. **Update Data Model**: Modify object structures if needed
3. **Add UI Elements**: Update render methods with new interface
4. **Wire Events**: Add event listeners and handlers
5. **Test Edge Cases**: Verify with various data formats

### Styling Guidelines
- **Use CSS Variables**: Always reference theme variables
- **Mobile-First**: Start with mobile layout, enhance for desktop
- **Consistent Spacing**: Use standard 8px grid system
- **Accessibility**: Ensure proper contrast ratios and focus states

### Performance Considerations
- **Efficient Re-renders**: Only update DOM when data actually changes
- **Event Delegation**: Use single listeners for multiple elements
- **Lazy Loading**: Components only process data when visible
- **Memory Management**: Clean up event listeners and references

## Testing Strategy

### Manual Testing Checklist
- [ ] Data import with various formats (tab, space, mixed)
- [ ] Column detection accuracy across different headers
- [ ] Personal investment calculations for various amounts
- [ ] Theme switching persistence across browser sessions
- [ ] Import/export round-trip data integrity
- [ ] Tab creation, naming, and deletion
- [ ] Overlap detection with 2+ ETFs
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Error handling for malformed data

### Browser Testing
- **Chrome/Edge**: Primary development target
- **Firefox**: Secondary testing
- **Safari**: Mobile and desktop testing
- **Mobile Browsers**: iOS Safari, Android Chrome

## Known Limitations & Future Improvements

### Current Limitations
- **Data Sources**: Manual copy/paste only (no API integration)
- **File Formats**: Limited to delimited text (no CSV/Excel import)
- **Calculations**: Basic percentage-based calculations only
- **Offline**: No offline functionality (requires browser)

### Potential Enhancements
- **API Integration**: Direct ETF data feeds
- **Advanced Analytics**: Sector analysis, correlation metrics
- **Export Formats**: PDF reports, CSV export
- **Collaboration**: Share comparison sets via URL
- **Historical Data**: Track changes over time

## Code Style & Conventions

### JavaScript
- **ES6+ Features**: Arrow functions, template literals, destructuring
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc-style comments for public methods
- **Error Handling**: Try-catch with user-friendly error messages

### CSS
- **BEM-ish Naming**: Component-based class naming
- **Custom Properties**: Always use CSS variables for theming
- **Mobile-First**: Media queries for progressive enhancement
- **Flexbox/Grid**: Modern layout techniques

### HTML
- **Semantic Elements**: Proper use of sections, articles, lists
- **Accessibility**: ARIA labels, proper heading hierarchy
- **Custom Elements**: Web Components for complex functionality

## Deployment & Maintenance

### Deployment
- **Static Hosting**: Any web server (GitHub Pages, Netlify, etc.)
- **No Build Process**: Files can be served directly
- **CDN Friendly**: All assets are self-contained

### Maintenance
- **Version Control**: Git with feature branches
- **Browser Updates**: Test with new browser versions
- **Security**: Regular review of localStorage usage
- **Performance**: Monitor with browser dev tools

## Security Considerations

### Data Privacy
- **Client-Side Only**: No data sent to external servers
- **LocalStorage**: Data stays in user's browser
- **No Tracking**: No analytics or external dependencies

### Input Validation
- **Data Sanitization**: Clean user input before processing
- **XSS Prevention**: Proper HTML escaping in templates
- **File Upload**: JSON validation for import functionality

## Browser Storage Quotas

### LocalStorage Limits
- **Typical Limit**: 5-10MB per origin
- **Data Efficiency**: JSON compression for large datasets
- **Quota Handling**: Graceful degradation when storage is full
- **User Control**: Clear storage option in settings

This documentation should provide comprehensive context for anyone working on this project, including AI assistants like Claude who need to understand the codebase structure and development patterns.