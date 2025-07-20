// Theme management
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? '' : 'dark';
    const toggleBtn = document.querySelector('.theme-toggle');
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    toggleBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.querySelector('.theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        toggleBtn.textContent = '☀️ Light Mode';
    } else {
        toggleBtn.textContent = '🌙 Dark Mode';
    }
}

// Data migration from old single-file format
function migrateOldData() {
    const oldData = localStorage.getItem('etf-data');
    const newTabs = localStorage.getItem('etf-tabs');
    
    if (oldData && !newTabs) {
        const etfs = JSON.parse(oldData);
        const defaultTab = {
            id: 'tab1',
            name: 'Comparison 1',
            etfs: etfs
        };
        localStorage.setItem('etf-tabs', JSON.stringify([defaultTab]));
        localStorage.removeItem('etf-data');
    }
}

// Global import/export controls
function setupGlobalControls() {
    const exportBtn = document.querySelector('#global-export-btn');
    const importFile = document.querySelector('#global-import-file');
    const wipeBtn = document.querySelector('#global-wipe-btn');
    const tabsManager = document.querySelector('etf-tabs-manager');

    if (exportBtn && tabsManager) {
        exportBtn.addEventListener('click', () => {
            tabsManager.exportData();
        });
    }

    if (importFile && tabsManager) {
        importFile.addEventListener('change', (e) => {
            tabsManager.importData(e);
        });
    }

    if (wipeBtn && tabsManager) {
        wipeBtn.addEventListener('click', () => {
            tabsManager.wipeAllData();
        });
    }
}

// Initialize application
function initializeApp() {
    loadTheme();
    migrateOldData();
    
    // Setup global controls after components are loaded
    setTimeout(setupGlobalControls, 100);
}

// Component registration
function registerComponents() {
    customElements.define('etf-tabs-manager', ETFTabsManager);
    customElements.define('etf-input-section', ETFInputSection);
    customElements.define('etf-comparison-view', ETFComparisonView);
}

// App startup
window.addEventListener('load', () => {
    registerComponents();
    initializeApp();
});