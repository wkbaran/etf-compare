# CLAUDE.md - Development Context for ETF Holdings Comparison Tool

## Project Overview

This is a browser-based ETF (Exchange-Traded Fund) holdings comparison tool built with vanilla JavaScript and Web Components. The application allows users to paste ETF holdings data, map columns, and compare multiple ETFs side-by-side to analyze overlaps and personal investment allocations.

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
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Accessibility**: Semantic HTML, proper ARIA labels, keyboard navigation

## File Structure & Responsibilities

```
etf-compare/
├── index-new.html      # Application shell, component registration
├── styles.css          # Complete styling system with CSS custom properties
├── components.js       # Three main web components
├── utils.js           # Utility functions and app initialization
├── README.md          # User documentation
└── CLAUDE.md          # This development context file
```

### Component Breakdown

#### ETFTabsManager
- **Purpose**: Manages multiple comparison sets through a tab interface
- **Key Features**: Tab creation/deletion, import/export, data persistence
- **Data Structure**: Array of tab objects, each containing ETF arrays
- **State Management**: Handles active tab switching and tab naming

#### ETFInputSection  
- **Purpose**: ETF data entry, column mapping, and processing
- **Key Features**: Smart column detection, data validation, format parsing
- **Data Processing**: Regex-based parsing for various data formats
- **User Flow**: Name → Values → Data paste → Column mapping → Processing

#### ETFComparisonView
- **Purpose**: Side-by-side ETF comparison with overlap analysis
- **Key Features**: Alphabetical sorting, overlap highlighting, statistics
- **Calculations**: Percentage-based personal position calculations
- **Visual Design**: Grid layout with responsive columns

## Data Model

### ETF Object Structure
```javascript
{
  name: "CIBR",                    // ETF ticker/name
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
- **Sorting**: Alphabetical ticker sorting for easy comparison

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