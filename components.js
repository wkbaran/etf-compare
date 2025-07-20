class ETFTabsManager extends HTMLElement {
    constructor() {
        super();
        this.tabs = this.loadTabs();
        this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
        this.render();
    }

    loadTabs() {
        const stored = localStorage.getItem('etf-tabs');
        const defaultTabs = stored ? JSON.parse(stored) : [{ id: 'tab1', name: 'Comparison 1', etfs: [] }];
        return defaultTabs;
    }

    saveTabs() {
        localStorage.setItem('etf-tabs', JSON.stringify(this.tabs));
    }

    render() {
        this.innerHTML = `
            <div class="tabs-container">
                <div class="tabs-header">
                    ${this.tabs.map(tab => `
                        <div class="tab ${tab.id === this.activeTabId ? 'active' : ''}" data-tab-id="${tab.id}">
                            <span class="tab-name" contenteditable="true" data-original="${tab.name}">${tab.name}</span>
                            ${this.tabs.length > 1 ? `<span class="tab-close" data-close-tab="${tab.id}">×</span>` : ''}
                        </div>
                    `).join('')}
                    <div class="new-tab-btn" id="new-tab-btn">+</div>
                </div>
            </div>
            ${this.tabs.map(tab => `
                <div class="tab-content ${tab.id === this.activeTabId ? 'active' : ''}" data-tab-content="${tab.id}">
                    <etf-input-section data-tab-id="${tab.id}"></etf-input-section>
                    <etf-comparison-view data-tab-id="${tab.id}"></etf-comparison-view>
                </div>
            `).join('')}
        `;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close') && !e.target.classList.contains('tab-name')) {
                    this.switchTab(tab.dataset.tabId);
                }
            });
        });

        this.querySelectorAll('.tab-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(closeBtn.dataset.closeTab);
            });
        });

        this.querySelectorAll('.tab-name').forEach(nameEl => {
            nameEl.addEventListener('blur', (e) => {
                this.updateTabName(e.target.closest('.tab').dataset.tabId, e.target.textContent.trim());
            });
            nameEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
                if (e.key === 'Escape') {
                    e.target.textContent = e.target.dataset.original;
                    e.target.blur();
                }
            });
        });

        const newTabBtn = this.querySelector('#new-tab-btn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => this.addNewTab());
        }
    }

    addNewTab() {
        const newId = 'tab' + Date.now();
        const newTab = {
            id: newId,
            name: `Comparison ${this.tabs.length + 1}`,
            etfs: []
        };
        this.tabs.push(newTab);
        this.activeTabId = newId;
        this.saveTabs();
        this.render();
    }

    closeTab(tabId) {
        if (this.tabs.length <= 1) return;
        
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        this.tabs.splice(tabIndex, 1);
        
        if (this.activeTabId === tabId) {
            this.activeTabId = this.tabs[Math.max(0, tabIndex - 1)].id;
        }
        
        this.saveTabs();
        this.render();
    }

    switchTab(tabId) {
        this.activeTabId = tabId;
        this.render();
    }

    updateTabName(tabId, newName) {
        if (!newName) return;
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.name = newName;
            this.saveTabs();
            this.render();
        }
    }

    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    updateTabETFs(tabId, etfs) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.etfs = etfs;
            this.saveTabs();
        }
    }

    copyETFToTab(etf, sourceTabId, destinationTabId) {
        console.log('Copying ETF:', etf.name, 'from', sourceTabId, 'to', destinationTabId);
        const destinationTab = this.tabs.find(t => t.id === destinationTabId);
        if (!destinationTab) {
            console.error('Destination tab not found:', destinationTabId);
            return false;
        }
        
        // Create a deep copy of the ETF
        const etfCopy = {
            name: etf.name,
            totalValue: etf.totalValue,
            displayValue: etf.displayValue,
            myInvestment: etf.myInvestment,
            holdings: etf.holdings.map(holding => ({...holding}))
        };
        
        // Check if ETF with same name already exists in destination tab
        const existingIndex = destinationTab.etfs.findIndex(e => e.name === etfCopy.name);
        if (existingIndex !== -1) {
            // Replace existing ETF
            destinationTab.etfs[existingIndex] = etfCopy;
        } else {
            // Add new ETF
            destinationTab.etfs.push(etfCopy);
        }
        
        this.saveTabs();
        
        // Trigger re-render of destination tab if it's not current
        const destinationInputSection = this.querySelector(`etf-input-section[data-tab-id="${destinationTabId}"]`);
        const destinationComparisonView = this.querySelector(`etf-comparison-view[data-tab-id="${destinationTabId}"]`);
        
        if (destinationInputSection) {
            destinationInputSection.etfs = destinationTab.etfs;
            destinationInputSection.render();
        }
        if (destinationComparisonView) {
            destinationComparisonView.etfs = destinationTab.etfs;
            destinationComparisonView.render();
        }
        
        return true;
    }

    exportData() {
        const exportData = {
            version: "1.0",
            exportDate: new Date().toISOString(),
            tabs: this.tabs.map(tab => ({
                id: tab.id,
                name: tab.name,
                etfs: tab.etfs
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `etf-comparison-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showImportStatus('Data exported successfully!', false);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!importData.tabs || !Array.isArray(importData.tabs)) {
                    throw new Error('Invalid file format: missing tabs array');
                }

                // Validate each tab
                const validTabs = importData.tabs.every(tab => 
                    tab.id && tab.name && Array.isArray(tab.etfs)
                );

                if (!validTabs) {
                    throw new Error('Invalid file format: invalid tab structure');
                }

                // Confirm import
                const confirmMessage = `This will replace all current data with ${importData.tabs.length} tabs. Continue?`;
                if (!confirm(confirmMessage)) {
                    event.target.value = ''; // Reset file input
                    return;
                }

                // Import the data
                this.tabs = importData.tabs.map(tab => ({
                    id: tab.id,
                    name: tab.name,
                    etfs: tab.etfs || []
                }));

                // Set active tab to first imported tab
                this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
                
                this.saveTabs();
                this.render();
                
                this.showImportStatus(`Successfully imported ${importData.tabs.length} tabs!`, false);
                
            } catch (error) {
                console.error('Import error:', error);
                this.showImportStatus(`Import failed: ${error.message}`, true);
            }
            
            // Reset file input
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }

    showImportStatus(message, isError = false) {
        const statusEl = document.querySelector('#global-import-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = isError ? 'import-error' : 'import-status';
            
            // Clear status after 3 seconds
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = '';
            }, 3000);
        }
    }

    wipeAllData() {
        const confirmMessage = 'This will permanently delete ALL your ETF data and tabs. This action cannot be undone.\n\nAre you sure you want to continue?';
        
        if (!confirm(confirmMessage)) {
            return;
        }

        // Second confirmation for extra safety
        const secondConfirm = 'FINAL WARNING: This will delete everything. Type "DELETE" to confirm:';
        const userInput = prompt(secondConfirm);
        
        if (userInput !== 'DELETE') {
            this.showImportStatus('Data wipe cancelled', false);
            return;
        }

        try {
            // Clear localStorage
            localStorage.removeItem('etf-tabs');
            localStorage.removeItem('etf-data'); // Legacy data key
            
            // Reset to default state
            this.tabs = [{ id: 'tab1', name: 'Comparison 1', etfs: [] }];
            this.activeTabId = 'tab1';
            
            // Save the reset state
            this.saveTabs();
            
            // Re-render everything
            this.render();
            
            this.showImportStatus('All data has been wiped successfully', false);
            
        } catch (error) {
            console.error('Error wiping data:', error);
            this.showImportStatus('Error wiping data: ' + error.message, true);
        }
    }
}

class ETFInputSection extends HTMLElement {
    constructor() {
        super();
        this.tabId = null;
        this.etfs = [];
    }

    connectedCallback() {
        this.tabId = this.dataset.tabId;
        this.etfs = this.loadETFs();
        this.render();
    }

    loadETFs() {
        const tabsManager = document.querySelector('etf-tabs-manager');
        if (tabsManager && this.tabId) {
            const tab = tabsManager.tabs.find(t => t.id === this.tabId);
            return tab ? tab.etfs : [];
        }
        return [];
    }

    saveETFs() {
        const tabsManager = document.querySelector('etf-tabs-manager');
        if (tabsManager && this.tabId) {
            tabsManager.updateTabETFs(this.tabId, this.etfs);
            this.dispatchEvent(new CustomEvent('etfs-updated', { 
                detail: { tabId: this.tabId, etfs: this.etfs },
                bubbles: true 
            }));
        }
    }

    render() {
        this.innerHTML = `
            <div class="etf-section">
                <h2>Add ETF Holdings</h2>
                <div style="margin-bottom: 15px;">
                    <input type="text" id="etf-name" placeholder="ETF Name (e.g., CIBR, UFO)" 
                           style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-right: 10px; width: 120px;">
                    <input type="number" id="etf-total-value" placeholder="123" min="1" max="9999"
                           style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-right: 5px; width: 60px;">
                    <select id="etf-value-unit" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-right: 10px; width: 50px;">
                        <option value="M">M</option>
                        <option value="B" selected>B</option>
                    </select>
                    <input type="number" id="my-investment" placeholder="My $" min="0" step="0.01"
                           style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-right: 10px; width: 100px;">
                    <button class="button" onclick="this.parentElement.parentElement.querySelector('.input-area').style.display='block'">
                        Add New ETF
                    </button>
                </div>
                
                <div class="input-area" style="display: none;">
                    <div style="margin-bottom: 15px;">
                        <label>Paste ETF holdings data:</label>
                        <textarea id="holdings-data" placeholder="Paste your ETF holdings data here..." 
                                 style="width: 100%; height: 200px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; margin-top: 5px; font-family: monospace;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Column mapping:</label>
                        <div style="margin-top: 8px;">
                            <select id="ticker-column" style="padding: 6px; margin-right: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                                <option value="">Select ticker column</option>
                            </select>
                            <select id="amount-column" style="padding: 6px; margin-right: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                                <option value="">Select amount column</option>
                            </select>
                            <select id="description-column" style="padding: 6px; margin-right: 10px; border: 1px solid var(--border-color); border-radius: 4px;">
                                <option value="">Select description column (optional)</option>
                            </select>
                            <button class="button-secondary button" id="detect-btn">
                                Detect Columns
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <button class="button" id="process-btn">Process ETF</button>
                        <button class="button-secondary button" onclick="this.parentElement.style.display='none'">Cancel</button>
                    </div>
                </div>
                
                <div class="existing-etfs">
                    ${this.renderExistingETFs()}
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const detectBtn = this.querySelector('#detect-btn');
        const processBtn = this.querySelector('#process-btn');
        
        if (detectBtn) {
            detectBtn.addEventListener('click', () => this.detectColumns());
        }
        
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processETF());
        }
        
        this.querySelectorAll('[data-remove-index]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-remove-index'));
                this.removeETF(index);
            });
        });
    }

    renderExistingETFs() {
        if (this.etfs.length === 0) return '';
        
        return `
            <div style="margin-top: 20px;">
                <h3>Loaded ETFs:</h3>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                    ${this.etfs.map((etf, index) => `
                        <div style="background: var(--bg-primary); border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
                            <span style="color: var(--text-primary);"><strong>${etf.name}</strong> ${etf.displayValue ? `(${etf.displayValue})` : ''} ${etf.myInvestment ? `- My: $${etf.myInvestment.toLocaleString()}` : ''} - ${etf.holdings.length} holdings</span>
                            <button class="button-secondary button" style="padding: 4px 8px; font-size: 12px;" data-remove-index="${index}">Remove</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    detectColumns() {
        const data = document.getElementById('holdings-data').value.trim();
        if (!data) return;

        const lines = data.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const headers = lines[0].split(/\s{2,}|\t/).map(h => h.trim());
        
        const tickerSelect = document.getElementById('ticker-column');
        const amountSelect = document.getElementById('amount-column');
        const descriptionSelect = document.getElementById('description-column');
        
        tickerSelect.innerHTML = '<option value="">Select ticker column</option>';
        amountSelect.innerHTML = '<option value="">Select amount column</option>';
        descriptionSelect.innerHTML = '<option value="">Select description column (optional)</option>';
        
        headers.forEach((header, index) => {
            tickerSelect.innerHTML += `<option value="${index}">${header}</option>`;
            amountSelect.innerHTML += `<option value="${index}">${header}</option>`;
            descriptionSelect.innerHTML += `<option value="${index}">${header}</option>`;
        });

        const tickerPattern = /ticker|symbol/i;
        const amountPattern = /weight|%|amount|value|assets/i;
        const descriptionPattern = /name|description|company|security/i;
        
        headers.forEach((header, index) => {
            if (tickerPattern.test(header)) {
                tickerSelect.value = index;
            }
            if (amountPattern.test(header)) {
                amountSelect.value = index;
            }
            if (descriptionPattern.test(header)) {
                descriptionSelect.value = index;
            }
        });
    }

    processETF() {
        const name = document.getElementById('etf-name').value.trim();
        const totalValue = parseFloat(document.getElementById('etf-total-value').value);
        const valueUnit = document.getElementById('etf-value-unit').value;
        const myInvestment = parseFloat(document.getElementById('my-investment').value);
        const data = document.getElementById('holdings-data').value.trim();
        const tickerCol = parseInt(document.getElementById('ticker-column').value);
        const amountCol = parseInt(document.getElementById('amount-column').value);
        const descriptionCol = document.getElementById('description-column').value;

        if (!name || !data || isNaN(tickerCol) || isNaN(amountCol)) {
            alert('Please fill all fields and select ticker/amount columns');
            return;
        }

        const lines = data.split('\n').filter(line => line.trim());
        const holdings = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(/\s{2,}|\t/).map(c => c.trim());
            if (cols.length > Math.max(tickerCol, amountCol)) {
                const ticker = cols[tickerCol];
                const amount = cols[amountCol];
                const description = descriptionCol && !isNaN(parseInt(descriptionCol)) ? cols[parseInt(descriptionCol)] : '';
                
                if (ticker && amount && ticker !== 'CASH' && !ticker.includes('Index')) {
                    holdings.push({
                        ticker: ticker.toUpperCase(),
                        amount: parseFloat(amount.replace(/[^\d.-]/g, '')) || 0,
                        description: description || ''
                    });
                }
            }
        }

        if (holdings.length === 0) {
            alert('No valid holdings found');
            return;
        }

        const totalValueInUSD = totalValue ? totalValue * (valueUnit === 'B' ? 1000000000 : 1000000) : null;
        
        this.etfs.push({ 
            name, 
            holdings, 
            totalValue: totalValueInUSD,
            displayValue: totalValue ? `$${totalValue}${valueUnit}` : null,
            myInvestment: myInvestment || 0
        });
        this.saveETFs();
        
        document.getElementById('etf-name').value = '';
        document.getElementById('etf-total-value').value = '';
        document.getElementById('my-investment').value = '';
        document.getElementById('holdings-data').value = '';
        document.querySelector('.input-area').style.display = 'none';
        
        this.render();
    }

    removeETF(index) {
        this.etfs.splice(index, 1);
        this.saveETFs();
        this.render();
    }
}

class ETFComparisonView extends HTMLElement {
    constructor() {
        super();
        this.tabId = null;
        this.etfs = [];
    }

    connectedCallback() {
        this.tabId = this.dataset.tabId;
        this.etfs = this.loadETFs();
        this.render();
        
        document.addEventListener('etfs-updated', (e) => {
            if (e.detail.tabId === this.tabId) {
                this.etfs = e.detail.etfs;
                this.render();
            }
        });
    }

    loadETFs() {
        const tabsManager = document.querySelector('etf-tabs-manager');
        if (tabsManager && this.tabId) {
            const tab = tabsManager.tabs.find(t => t.id === this.tabId);
            return tab ? tab.etfs : [];
        }
        return [];
    }

    render() {
        if (this.etfs.length === 0) {
            this.innerHTML = '';
            return;
        }

        const overlaps = this.calculateOverlaps();
        
        this.innerHTML = `
            <div class="comparison-view">
                ${this.renderOverlapStats(overlaps)}
                ${this.renderHoldingsComparison(overlaps)}
            </div>
        `;
        
        this.setupCopyButtons();
    }

    calculateOverlaps() {
        if (this.etfs.length < 2) return { overlapping: [], stats: {} };

        const allTickers = new Set();
        const tickerToETFs = {};

        this.etfs.forEach((etf, etfIndex) => {
            etf.holdings.forEach(holding => {
                const ticker = holding.ticker;
                allTickers.add(ticker);
                if (!tickerToETFs[ticker]) {
                    tickerToETFs[ticker] = [];
                }
                tickerToETFs[ticker].push({ etfIndex, ...holding });
            });
        });

        const overlapping = Array.from(allTickers).filter(ticker => 
            tickerToETFs[ticker].length > 1
        );

        const stats = {
            totalUnique: allTickers.size,
            overlapping: overlapping.length,
            overlapPercentage: ((overlapping.length / allTickers.size) * 100).toFixed(1)
        };

        return { overlapping, tickerToETFs, stats };
    }
    
    setupCopyButtons() {
        this.querySelectorAll('.copy-etf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                const etf = this.etfs[etfIndex];
                this.showCopyModal(etf);
            });
        });
    }
    
    showCopyModal(etf) {
        const tabsManager = document.querySelector('etf-tabs-manager');
        if (!tabsManager) return;
        
        const otherTabs = tabsManager.tabs.filter(tab => tab.id !== this.tabId);
        
        if (otherTabs.length === 0) {
            alert('No other tabs available. Create a new tab first.');
            return;
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'copy-modal';
        modal.innerHTML = `
            <div class="copy-modal-content">
                <h3>Copy "${etf.name}" to another tab</h3>
                <div class="tab-list">
                    ${otherTabs.map(tab => `
                        <button class="tab-option" data-tab-id="${tab.id}">
                            ${tab.name}
                        </button>
                    `).join('')}
                </div>
                <div class="modal-buttons">
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Style the modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const content = modal.querySelector('.copy-modal-content');
        content.style.cssText = `
            background: var(--bg-primary);
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            width: 90%;
            border: 1px solid var(--border-color);
        `;
        
        // Event listeners
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelectorAll('.tab-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const destinationTabId = e.target.getAttribute('data-tab-id');
                const success = tabsManager.copyETFToTab(etf, this.tabId, destinationTabId);
                
                if (success) {
                    const destinationTab = tabsManager.tabs.find(t => t.id === destinationTabId);
                    alert(`ETF "${etf.name}" copied to "${destinationTab.name}"`);
                } else {
                    alert('Failed to copy ETF');
                }
                
                document.body.removeChild(modal);
            });
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }

    renderOverlapStats(overlaps) {
        if (this.etfs.length < 2) return '';

        return `
            <div class="overlap-stats">
                <h3>Overlap Analysis</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${overlaps.stats.totalUnique}</div>
                        <div class="stat-label">Total Unique Holdings</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${overlaps.stats.overlapping}</div>
                        <div class="stat-label">Overlapping Holdings</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${overlaps.stats.overlapPercentage}%</div>
                        <div class="stat-label">Overlap Percentage</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderHoldingsComparison(overlaps) {
        if (this.etfs.length === 0) return '';

        const allTickers = new Set();
        this.etfs.forEach(etf => {
            etf.holdings.forEach(holding => allTickers.add(holding.ticker));
        });

        const sortedTickers = Array.from(allTickers).sort();

        return `
            <div class="holdings-grid">
                ${this.etfs.map((etf, etfIndex) => `
                    <div class="etf-column">
                        <div class="etf-header">
                            <h3>${etf.name} ${etf.displayValue ? `(${etf.displayValue})` : ''} ${etf.myInvestment ? `- My: $${etf.myInvestment.toLocaleString()}` : ''}</h3>
                            <button class="copy-etf-btn" data-etf-index="${etfIndex}" title="Copy ETF to another tab">📋</button>
                        </div>
                        ${sortedTickers.map(ticker => {
                            const holding = etf.holdings.find(h => h.ticker === ticker);
                            const isOverlap = overlaps.tickerToETFs && overlaps.tickerToETFs[ticker] && overlaps.tickerToETFs[ticker].length > 1;
                            
                            if (holding) {
                                const usdValue = etf.totalValue ? (etf.totalValue * holding.amount / 100) : null;
                                const usdDisplay = usdValue ? 
                                    (usdValue >= 1000000000 ? `$${(usdValue/1000000000).toFixed(1)}B` :
                                     usdValue >= 1000000 ? `$${(usdValue/1000000).toFixed(1)}M` :
                                     `$${(usdValue/1000).toFixed(0)}K`) : '';
                                
                                // Calculate personal position based on percentage of personal investment, not ETF total value
                                const myPositionValue = etf.myInvestment ? (etf.myInvestment * holding.amount / 100) : null;
                                const myPositionDisplay = myPositionValue ? 
                                    (myPositionValue >= 1000000 ? `$${(myPositionValue/1000000).toFixed(2)}M` :
                                     myPositionValue >= 1000 ? `$${(myPositionValue/1000).toFixed(1)}K` :
                                     myPositionValue >= 1 ? `$${myPositionValue.toFixed(2)}` :
                                     `$${myPositionValue.toFixed(2)}`) : '';
                                
                                return `
                                    <div class="holding-item ${isOverlap ? 'overlap' : ''}">
                                        <div class="holding-header">
                                            <span class="ticker">${ticker}</span>
                                            <div style="text-align: right;">
                                                <div class="amount">${holding.amount.toFixed(2)}%</div>
                                                ${usdDisplay ? `<div class="usd-value">${usdDisplay}</div>` : ''}
                                                ${myPositionDisplay ? `<div class="my-investment-value">My: ${myPositionDisplay}</div>` : ''}
                                            </div>
                                        </div>
                                        ${holding.description ? `<div class="description">${holding.description}</div>` : ''}
                                    </div>
                                `;
                            } else if (isOverlap) {
                                return `
                                    <div class="holding-item" style="opacity: 0.3;">
                                        <div class="holding-header">
                                            <span class="ticker">${ticker}</span>
                                            <span class="amount">—</span>
                                        </div>
                                    </div>
                                `;
                            }
                            return '';
                        }).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }
}