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
        
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        // Check if tab has any ETFs
        if (tab.etfs && tab.etfs.length > 0) {
            const etfCount = tab.etfs.length;
            const tabName = tab.name;
            const confirmMessage = `"${tabName}" contains ${etfCount} ETF${etfCount > 1 ? 's' : ''}. Are you sure you want to close this tab? This will permanently delete all ETF data in this tab.`;
            
            if (!confirm(confirmMessage)) {
                return; // User cancelled, don't close the tab
            }
        }
        
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
            displayName: etf.displayName,
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

    reorderETF(tabId, fromIndex, toIndex) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
            fromIndex >= tab.etfs.length || toIndex >= tab.etfs.length) {
            return false;
        }

        // Remove ETF from current position and insert at new position
        const [movedETF] = tab.etfs.splice(fromIndex, 1);
        tab.etfs.splice(toIndex, 0, movedETF);
        
        this.saveTabs();
        
        // Trigger re-render of the tab
        const inputSection = this.querySelector(`etf-input-section[data-tab-id="${tabId}"]`);
        const comparisonView = this.querySelector(`etf-comparison-view[data-tab-id="${tabId}"]`);
        
        if (inputSection) {
            inputSection.etfs = tab.etfs;
            inputSection.render();
        }
        if (comparisonView) {
            comparisonView.etfs = tab.etfs;
            comparisonView.render();
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
        this.replacingIndex = -1; // Track which ETF we're replacing (-1 = not replacing)
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
                    <input type="text" id="etf-name" placeholder="ETF Ticker (e.g., CIBR, UFO)" 
                           style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-right: 10px; width: 120px;">
                    <input type="text" id="etf-display-name" placeholder="Display Name (optional)" 
                           style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin-right: 10px; width: 150px;">
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
                        <button class="button-secondary button" id="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const detectBtn = this.querySelector('#detect-btn');
        const processBtn = this.querySelector('#process-btn');
        const cancelBtn = this.querySelector('#cancel-btn');
        
        if (detectBtn) {
            detectBtn.addEventListener('click', () => this.detectColumns());
        }
        
        if (processBtn) {
            processBtn.addEventListener('click', () => this.processETF());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelInput());
        }
        
        this.querySelectorAll('[data-remove-index]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-remove-index'));
                this.removeETF(index);
            });
        });


        // Setup editing for input section
        this.querySelectorAll('.etf-total-value-edit-small').forEach(element => {
            element.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                this.startTotalValueEditSmall(etfIndex, e.target);
            });
        });

        this.querySelectorAll('.my-investment-edit-small').forEach(element => {
            element.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                this.startInvestmentEditSmall(etfIndex, e.target);
            });
        });
    }


    detectColumns() {
        const data = this.querySelector('#holdings-data').value.trim();
        if (!data) return;

        const lines = data.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const headers = lines[0].split(/\s{2,}|\t/).map(h => h.trim());
        
        const tickerSelect = this.querySelector('#ticker-column');
        const amountSelect = this.querySelector('#amount-column');
        const descriptionSelect = this.querySelector('#description-column');
        
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
        const name = this.querySelector('#etf-name').value.trim();
        const displayName = this.querySelector('#etf-display-name').value.trim();
        const totalValue = parseFloat(this.querySelector('#etf-total-value').value);
        const valueUnit = this.querySelector('#etf-value-unit').value;
        const myInvestment = parseFloat(this.querySelector('#my-investment').value);
        const data = this.querySelector('#holdings-data').value.trim();
        const tickerCol = parseInt(this.querySelector('#ticker-column').value);
        const amountCol = parseInt(this.querySelector('#amount-column').value);
        const descriptionCol = this.querySelector('#description-column').value;

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
        
        if (this.replacingIndex >= 0) {
            // Replace existing ETF holdings while preserving other data
            const existingETF = this.etfs[this.replacingIndex];
            this.etfs[this.replacingIndex] = {
                name: name || existingETF.name,
                displayName: displayName || existingETF.displayName,
                holdings, // Replace with new holdings
                totalValue: totalValueInUSD !== null ? totalValueInUSD : existingETF.totalValue,
                displayValue: totalValue ? `$${totalValue}${valueUnit}` : existingETF.displayValue,
                myInvestment: myInvestment !== null && !isNaN(myInvestment) ? myInvestment : existingETF.myInvestment
            };
            this.replacingIndex = -1; // Reset replacement mode
        } else {
            // Add new ETF
            this.etfs.push({ 
                name, 
                displayName: displayName || null,
                holdings, 
                totalValue: totalValueInUSD,
                displayValue: totalValue ? `$${totalValue}${valueUnit}` : null,
                myInvestment: myInvestment || 0
            });
        }
        this.saveETFs();
        
        this.querySelector('#etf-name').value = '';
        this.querySelector('#etf-display-name').value = '';
        this.querySelector('#etf-total-value').value = '';
        this.querySelector('#my-investment').value = '';
        this.querySelector('#holdings-data').value = '';
        this.querySelector('.input-area').style.display = 'none';
        
        // Reset button text and replacement mode
        const processBtn = this.querySelector('#process-btn');
        if (processBtn) {
            processBtn.textContent = 'Process ETF';
        }
        this.replacingIndex = -1;
        
        this.render();
    }

    startTotalValueEditSmall(etfIndex, element) {
        const etf = this.etfs[etfIndex];
        const currentValue = etf.totalValue;
        
        // Parse current value to show in input
        let inputValue = '';
        let selectedUnit = 'B';
        
        if (currentValue) {
            if (currentValue >= 1000000000) {
                inputValue = (currentValue / 1000000000).toString();
                selectedUnit = 'B';
            } else {
                inputValue = (currentValue / 1000000).toString();
                selectedUnit = 'M';
            }
        }

        // Create input elements
        const inputContainer = document.createElement('span');
        inputContainer.style.cssText = 'display: inline-flex; align-items: center; gap: 2px;';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = inputValue;
        input.step = '0.1';
        input.min = '0';
        input.style.cssText = 'width: 50px; padding: 1px 2px; border: 1px solid var(--accent-color); border-radius: 2px; font-size: 12px;';
        
        const select = document.createElement('select');
        select.innerHTML = '<option value="M">M</option><option value="B">B</option>';
        select.value = selectedUnit;
        select.style.cssText = 'padding: 1px; border: 1px solid var(--accent-color); border-radius: 2px; font-size: 12px;';
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(select);
        
        // Replace element with input
        element.parentNode.replaceChild(inputContainer, element);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            const newValue = parseFloat(input.value);
            const unit = select.value;
            
            if (!isNaN(newValue) && newValue > 0) {
                const totalValueInUSD = newValue * (unit === 'B' ? 1000000000 : 1000000);
                etf.totalValue = totalValueInUSD;
                etf.displayValue = `$${newValue}${unit}`;
            } else {
                etf.totalValue = null;
                etf.displayValue = null;
            }
            
            this.saveETFs();
            this.render();
        };
        
        const cancelEdit = () => {
            this.render();
        };
        
        let isInteracting = false;
        
        input.addEventListener('blur', () => {
            // Delay to allow dropdown interaction
            setTimeout(() => {
                if (!isInteracting) finishEdit();
            }, 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') cancelEdit();
        });
        
        select.addEventListener('mousedown', () => {
            isInteracting = true;
        });
        
        select.addEventListener('blur', () => {
            setTimeout(() => {
                isInteracting = false;
                finishEdit();
            }, 100);
        });
        
        select.addEventListener('change', () => {
            isInteracting = false;
        });
        // Don't auto-finish on dropdown change, let user choose
    }

    startInvestmentEditSmall(etfIndex, element) {
        const etf = this.etfs[etfIndex];
        const currentValue = etf.myInvestment || 0;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue.toString();
        input.step = '0.01';
        input.min = '0';
        input.style.cssText = 'width: 60px; padding: 1px 2px; border: 1px solid var(--accent-color); border-radius: 2px; font-size: 12px;';
        
        // Replace element with input
        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            const newValue = parseFloat(input.value);
            etf.myInvestment = !isNaN(newValue) && newValue >= 0 ? newValue : 0;
            this.saveETFs();
            this.render();
        };
        
        const cancelEdit = () => {
            this.render();
        };
        
        let isInteracting = false;
        
        input.addEventListener('blur', () => {
            // Delay to allow dropdown interaction
            setTimeout(() => {
                if (!isInteracting) finishEdit();
            }, 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') cancelEdit();
        });
    }

    cancelInput() {
        // Hide input area
        this.querySelector('.input-area').style.display = 'none';
        
        // Reset button text and replacement mode
        const processBtn = this.querySelector('#process-btn');
        if (processBtn) {
            processBtn.textContent = 'Process ETF';
        }
        this.replacingIndex = -1;
        
        // Clear form fields
        this.querySelector('#holdings-data').value = '';
        
        // Only clear ETF metadata fields if we were in replacement mode
        // (in replacement mode, we want to preserve the original ETF data)
    }

    startReplaceHoldings(index) {
        const etf = this.etfs[index];
        if (!etf) return;

        // Set replacement mode
        this.replacingIndex = index;

        // Pre-populate the form with existing ETF data (but leave holdings empty for replacement)
        this.querySelector('#etf-name').value = etf.name;
        this.querySelector('#etf-display-name').value = etf.displayName || '';
        
        // Set total value fields
        if (etf.totalValue) {
            if (etf.totalValue >= 1000000000) {
                this.querySelector('#etf-total-value').value = (etf.totalValue / 1000000000).toString();
                this.querySelector('#etf-value-unit').value = 'B';
            } else {
                this.querySelector('#etf-total-value').value = (etf.totalValue / 1000000).toString();
                this.querySelector('#etf-value-unit').value = 'M';
            }
        }
        
        this.querySelector('#my-investment').value = etf.myInvestment || '';

        // Clear the holdings data area for new input
        this.querySelector('#holdings-data').value = '';
        
        // Show the input area
        this.querySelector('.input-area').style.display = 'block';
        
        // Update the button text to indicate replacement
        const processBtn = this.querySelector('#process-btn');
        if (processBtn) {
            processBtn.textContent = 'Replace Holdings';
        }
        
        // Focus on the holdings data area
        this.querySelector('#holdings-data').focus();
        
        // Scroll to the input area
        this.querySelector('.input-area').scrollIntoView({ behavior: 'smooth' });
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
        this.etfSortState = {}; // Track sort state per ETF: {etfIndex: 'ticker'|'weight'}
        this.etfCollapseState = {}; // Track collapse state per ETF: {etfIndex: boolean}
    }

    connectedCallback() {
        this.tabId = this.dataset.tabId;
        this.etfs = this.loadETFs();
        this.etfCollapseState = this.loadCollapseState();
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

    saveCollapseState() {
        if (!this.tabId) return;
        const storageKey = `etf-collapse-${this.tabId}`;
        localStorage.setItem(storageKey, JSON.stringify(this.etfCollapseState));
    }

    loadCollapseState() {
        if (!this.tabId) return {};
        const storageKey = `etf-collapse-${this.tabId}`;
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
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
        this.setupETFSortControls();
        this.setupReorderButtons();
        this.setupCollapseButtons();
        this.setupRemoveButtons();
        this.setupValueEditing();
        this.setupReplaceButtons();
    }

    isValidTickerForOverlap(ticker) {
        // Exclude invalid/placeholder tickers from overlap detection
        if (!ticker || ticker.trim() === '') return false;
        
        const trimmed = ticker.trim().toUpperCase();
        
        // Exclude common placeholder text values
        if (trimmed === 'CASH') return false;
        if (trimmed === 'N/A') return false;
        if (trimmed === 'TBD') return false;
        if (trimmed === 'UNKNOWN') return false;
        if (trimmed === 'OTHER') return false;
        if (trimmed.includes('INDEX')) return false;
        
        // Exclude anything that doesn't start with a letter or number
        const firstChar = trimmed.charAt(0);
        if (!/[A-Z0-9]/.test(firstChar)) return false;
        
        return true;
    }

    calculateOverlaps() {
        if (this.etfs.length < 2) return { overlapping: [], stats: {} };

        const allTickers = new Set();
        const tickerToETFs = {};

        this.etfs.forEach((etf, etfIndex) => {
            etf.holdings.forEach(holding => {
                const ticker = holding.ticker;
                // Only include valid tickers in overlap detection
                if (this.isValidTickerForOverlap(ticker)) {
                    allTickers.add(ticker);
                    if (!tickerToETFs[ticker]) {
                        tickerToETFs[ticker] = [];
                    }
                    tickerToETFs[ticker].push({ etfIndex, ...holding });
                }
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

    setupETFSortControls() {
        this.querySelectorAll('.sort-arrow').forEach(button => {
            button.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                const sortType = e.target.getAttribute('data-sort');
                this.etfSortState[etfIndex] = sortType;
                this.render();
            });
        });
    }

    setupReorderButtons() {
        this.querySelectorAll('.reorder-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                const direction = e.target.getAttribute('data-direction');
                const tabsManager = document.querySelector('etf-tabs-manager');
                
                if (tabsManager && this.tabId) {
                    const newIndex = direction === 'left' ? etfIndex - 1 : etfIndex + 1;
                    tabsManager.reorderETF(this.tabId, etfIndex, newIndex);
                }
            });
        });
    }

    setupCollapseButtons() {
        this.querySelectorAll('.collapse-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const etfKey = e.target.getAttribute('data-etf-key');
                this.etfCollapseState[etfKey] = !this.etfCollapseState[etfKey];
                this.saveCollapseState();
                this.render();
            });
        });
    }

    setupRemoveButtons() {
        this.querySelectorAll('.remove-etf-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                const etf = this.etfs[etfIndex];
                
                if (confirm(`Are you sure you want to remove "${etf.name}"?`)) {
                    this.removeETF(etfIndex);
                }
            });
        });
    }

    removeETF(etfIndex) {
        // Remove ETF from the array
        this.etfs.splice(etfIndex, 1);
        
        // Update the tab's ETF data
        const tabsManager = document.querySelector('etf-tabs-manager');
        if (tabsManager && this.tabId) {
            tabsManager.updateTabETFs(this.tabId, this.etfs);
        }
        
        // Re-render the view
        this.render();
        
        // Dispatch update event
        this.dispatchEvent(new CustomEvent('etfs-updated', { 
            detail: { tabId: this.tabId, etfs: this.etfs },
            bubbles: true 
        }));
    }

    setupReplaceButtons() {
        this.querySelectorAll('.replace-holdings-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                this.startReplaceHoldings(etfIndex);
            });
        });
    }

    startReplaceHoldings(etfIndex) {
        // Find the input section to trigger replacement mode
        const inputSection = document.querySelector(`etf-input-section[data-tab-id="${this.tabId}"]`);
        if (inputSection) {
            inputSection.startReplaceHoldings(etfIndex);
            
            // Scroll to the input section
            inputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    setupValueEditing() {
        // Setup total value editing
        this.querySelectorAll('.etf-total-value-edit').forEach(element => {
            element.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                this.startTotalValueEdit(etfIndex, e.target);
            });
        });

        // Setup investment amount editing
        this.querySelectorAll('.my-investment-edit').forEach(element => {
            element.addEventListener('click', (e) => {
                const etfIndex = parseInt(e.target.getAttribute('data-etf-index'));
                this.startInvestmentEdit(etfIndex, e.target);
            });
        });
    }

    startTotalValueEdit(etfIndex, element) {
        const etf = this.etfs[etfIndex];
        const currentValue = etf.totalValue;
        
        // Parse current value to show in input
        let inputValue = '';
        let selectedUnit = 'B';
        
        if (currentValue) {
            if (currentValue >= 1000000000) {
                inputValue = (currentValue / 1000000000).toString();
                selectedUnit = 'B';
            } else {
                inputValue = (currentValue / 1000000).toString();
                selectedUnit = 'M';
            }
        }

        // Create input elements
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'display: flex; align-items: center; gap: 4px;';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.value = inputValue;
        input.step = '0.1';
        input.min = '0';
        input.style.cssText = 'width: 60px; padding: 2px 4px; border: 1px solid var(--accent-color); border-radius: 2px; font-size: 14px;';
        
        const select = document.createElement('select');
        select.innerHTML = '<option value="M">M</option><option value="B">B</option>';
        select.value = selectedUnit;
        select.style.cssText = 'padding: 2px; border: 1px solid var(--accent-color); border-radius: 2px; font-size: 14px;';
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(select);
        
        // Replace element with input
        element.parentNode.replaceChild(inputContainer, element);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            const newValue = parseFloat(input.value);
            const unit = select.value;
            
            if (!isNaN(newValue) && newValue > 0) {
                const totalValueInUSD = newValue * (unit === 'B' ? 1000000000 : 1000000);
                etf.totalValue = totalValueInUSD;
                etf.displayValue = `$${newValue}${unit}`;
            } else {
                etf.totalValue = null;
                etf.displayValue = null;
            }
            
            this.saveETFChanges();
            this.render();
        };
        
        const cancelEdit = () => {
            this.render();
        };
        
        let isInteracting = false;
        
        input.addEventListener('blur', () => {
            // Delay to allow dropdown interaction
            setTimeout(() => {
                if (!isInteracting) finishEdit();
            }, 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') cancelEdit();
        });
        
        select.addEventListener('mousedown', () => {
            isInteracting = true;
        });
        
        select.addEventListener('blur', () => {
            setTimeout(() => {
                isInteracting = false;
                finishEdit();
            }, 100);
        });
        
        select.addEventListener('change', () => {
            isInteracting = false;
        });
        // Don't auto-finish on dropdown change, let user choose
    }

    startInvestmentEdit(etfIndex, element) {
        const etf = this.etfs[etfIndex];
        const currentValue = etf.myInvestment || 0;
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue.toString();
        input.step = '0.01';
        input.min = '0';
        input.style.cssText = 'width: 80px; padding: 2px 4px; border: 1px solid var(--accent-color); border-radius: 2px; font-size: 14px;';
        
        // Replace element with input
        element.parentNode.replaceChild(input, element);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            const newValue = parseFloat(input.value);
            etf.myInvestment = !isNaN(newValue) && newValue >= 0 ? newValue : 0;
            this.saveETFChanges();
            this.render();
        };
        
        const cancelEdit = () => {
            this.render();
        };
        
        let isInteracting = false;
        
        input.addEventListener('blur', () => {
            // Delay to allow dropdown interaction
            setTimeout(() => {
                if (!isInteracting) finishEdit();
            }, 150);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finishEdit();
            if (e.key === 'Escape') cancelEdit();
        });
    }

    saveETFChanges() {
        const tabsManager = document.querySelector('etf-tabs-manager');
        if (tabsManager && this.tabId) {
            tabsManager.updateTabETFs(this.tabId, this.etfs);
        }
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

        // Check if there are multiple tabs to determine if copy button should be shown
        const tabsManager = document.querySelector('etf-tabs-manager');
        const showCopyButton = tabsManager && tabsManager.tabs.length > 1;

        return `
            <div class="holdings-grid">
                ${this.etfs.map((etf, etfIndex) => {
                    // Initialize sort state for this ETF if not set
                    if (!this.etfSortState.hasOwnProperty(etfIndex)) {
                        this.etfSortState[etfIndex] = 'ticker';
                    }
                    
                    // Initialize collapse state for this ETF if not set (default: expanded)
                    // Use ETF name as key for persistence across reorders
                    const etfKey = etf.name;
                    if (!this.etfCollapseState.hasOwnProperty(etfKey)) {
                        this.etfCollapseState[etfKey] = false;
                    }
                    
                    // Sort this ETF's holdings based on its individual sort state
                    let sortedHoldings;
                    if (this.etfSortState[etfIndex] === 'weight') {
                        sortedHoldings = [...etf.holdings].sort((a, b) => b.amount - a.amount);
                    } else {
                        sortedHoldings = [...etf.holdings].sort((a, b) => a.ticker.localeCompare(b.ticker));
                    }

                    return `
                        <div class="etf-column" data-etf-index="${etfIndex}">
                            <div class="etf-header">
                                ${etfIndex > 0 ? `<button class="reorder-btn reorder-left" data-etf-index="${etfIndex}" data-direction="left" title="Move left">◀</button>` : ''}
                                <div style="flex: 1;">
                                    <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
                                        <span>${etf.name}</span>
                                        <span class="etf-total-value-edit" data-etf-index="${etfIndex}" style="cursor: pointer; color: var(--text-secondary); font-size: 14px;" title="Click to edit total value">${etf.displayValue || '(No total set)'}</span>
                                        ${etf.myInvestment ? `<span class="my-investment-edit" data-etf-index="${etfIndex}" style="cursor: pointer; color: var(--accent-color); font-size: 14px;" title="Click to edit investment amount">- My: $${etf.myInvestment.toLocaleString()}</span>` : `<span class="my-investment-edit" data-etf-index="${etfIndex}" style="cursor: pointer; color: var(--text-secondary); font-size: 14px;" title="Click to add investment amount">- My: (Not set)</span>`}
                                    </h3>
                                    ${etf.displayName ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${etf.displayName}</div>` : ''}
                                </div>
                                <button class="collapse-btn" data-etf-key="${etfKey}" title="${this.etfCollapseState[etfKey] ? 'Expand holdings' : 'Collapse holdings'}">${this.etfCollapseState[etfKey] ? '▲' : '▼'}</button>
                                <button class="replace-holdings-btn" data-etf-index="${etfIndex}" title="Replace holdings data">📝</button>
                                <button class="remove-etf-btn" data-etf-index="${etfIndex}" title="Remove ETF">🗑️</button>
                                ${showCopyButton ? `<button class="copy-etf-btn" data-etf-index="${etfIndex}" title="Copy ETF to another tab">📋</button>` : ''}
                                ${etfIndex < this.etfs.length - 1 ? `<button class="reorder-btn reorder-right" data-etf-index="${etfIndex}" data-direction="right" title="Move right">▶</button>` : ''}
                            </div>
                            <div class="etf-holdings-content ${this.etfCollapseState[etfKey] ? 'collapsed' : 'expanded'}">
                                <div class="etf-sort-controls" style="position: relative; margin: 4px 0; height: 20px;">
                                    <button class="sort-arrow sort-ticker" data-etf-index="${etfIndex}" data-sort="ticker" 
                                            style="position: absolute; left: 0; background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 14px; padding: 2px; ${this.etfSortState[etfIndex] === 'ticker' ? 'opacity: 1;' : 'opacity: 0.3;'}" 
                                            title="Sort alphabetically by ticker">
                                        ↑A-Z
                                    </button>
                                    <button class="sort-arrow sort-weight" data-etf-index="${etfIndex}" data-sort="weight" 
                                            style="position: absolute; right: 0; background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 14px; padding: 2px; ${this.etfSortState[etfIndex] === 'weight' ? 'opacity: 1;' : 'opacity: 0.3;'}" 
                                            title="Sort by weight (high to low)">
                                        ↓%
                                    </button>
                                </div>
                                ${sortedHoldings.map(holding => {
                                const isOverlap = this.isValidTickerForOverlap(holding.ticker) && overlaps.tickerToETFs && overlaps.tickerToETFs[holding.ticker] && overlaps.tickerToETFs[holding.ticker].length > 1;
                                
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
                                            <div style="flex: 1; min-width: 0;">
                                                <div class="ticker">${holding.ticker}</div>
                                                ${holding.description ? `<div class="description">${holding.description}</div>` : ''}
                                            </div>
                                            <div style="text-align: right; white-space: nowrap; margin-left: 8px;">
                                                <div class="amount">${holding.amount.toFixed(2)}%</div>
                                                ${usdDisplay ? `<div class="usd-value">${usdDisplay}</div>` : ''}
                                                ${myPositionDisplay ? `<div class="my-investment-value">My: ${myPositionDisplay}</div>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

// Components are registered in utils.js