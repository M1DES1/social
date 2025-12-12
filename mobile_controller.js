class MobileMinecraftController {
    constructor() {
        this.apiUrl = "https://turbo-fortnight-wr757r5wr7wrfgw75-5001.app.github.dev";
        this.isConnected = false;
        this.currentPath = '/';
        this.currentFile = null;
        
        this.elements = {
            statusIndicator: document.getElementById('statusIndicator'),
            statusTitle: document.getElementById('statusTitle'),
            statusDetails: document.getElementById('statusDetails'),
            playerCount: document.getElementById('playerCount'),
            currentEngine: document.getElementById('currentEngine'),
            currentVersion: document.getElementById('currentVersion'),
            
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            restartBtn: document.getElementById('restartBtn'),
            
            consoleOutput: document.getElementById('consoleOutput'),
            commandInput: document.getElementById('commandInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            
            versionSelect: document.getElementById('versionSelect'),
            downloadBtn: document.getElementById('downloadBtn'),
            javaRequirement: document.getElementById('javaRequirement'),
            downloadProgress: document.getElementById('downloadProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            backBtn: document.getElementById('backBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            deleteBtn: document.getElementById('deleteBtn'),
            filePath: document.getElementById('filePath'),
            fileList: document.getElementById('fileList'),
            fileContent: document.getElementById('fileContent'),
            saveFileBtn: document.getElementById('saveFileBtn'),
            
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            browsePluginsBtn: document.getElementById('browsePluginsBtn'),
            pluginUpload: document.getElementById('pluginUpload'),
            pluginsList: document.getElementById('pluginsList'),
            
            connectionStatus: document.getElementById('connectionStatus'),
            backendUrl: document.getElementById('backendUrl'),
            lastCheck: document.getElementById('lastCheck'),
            
            tabButtons: document.querySelectorAll('.tab-btn'),
            hiddenFileUpload: document.getElementById('hiddenFileUpload')
        };
        
        this.init();
    }
    
    init() {
        this.elements.backendUrl.textContent = this.apiUrl;
        this.setupEventListeners();
        this.setupTabs();
        this.checkConnection();
        
        // Ustawienia touch-friendly
        this.setupTouchEvents();
        
        // Start auto-refresh
        setInterval(() => this.checkStatus(), 5000);
    }
    
    setupEventListeners() {
        // Basic controls
        this.elements.startBtn.addEventListener('click', () => this.sendCommand('start'));
        this.elements.stopBtn.addEventListener('click', () => this.sendCommand('stop'));
        this.elements.restartBtn.addEventListener('click', () => this.sendCommand('restart'));
        
        // Console
        this.elements.sendBtn.addEventListener('click', () => this.sendConsoleCommand());
        this.elements.clearBtn.addEventListener('click', () => this.clearConsole());
        this.elements.refreshBtn.addEventListener('click', () => this.checkStatus());
        this.elements.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendConsoleCommand();
        });
        
        // Version manager
        this.elements.downloadBtn.addEventListener('click', () => this.downloadVersion());
        
        // File manager
        this.elements.backBtn.addEventListener('click', () => this.navigateUp());
        this.elements.uploadBtn.addEventListener('click', () => this.elements.hiddenFileUpload.click());
        this.elements.deleteBtn.addEventListener('click', () => this.deleteFile());
        this.elements.saveFileBtn.addEventListener('click', () => this.saveFile());
        this.elements.hiddenFileUpload.addEventListener('change', (e) => this.uploadFiles(e.target.files));
        
        // Settings
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Plugins
        this.elements.browsePluginsBtn.addEventListener('click', () => this.elements.pluginUpload.click());
        this.elements.pluginUpload.addEventListener('change', (e) => this.uploadPlugins(e.target.files));
        
        // Engine selection
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectEngine(e.target.dataset.engine));
        });
        
        // Quick actions
        document.getElementById('quickStartBtn')?.addEventListener('click', () => {
            this.sendCommand('start');
            document.getElementById('quickMenu').classList.remove('show');
        });
    }
    
    setupTabs() {
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active from all
                this.elements.tabButtons.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active to clicked
                const tab = e.currentTarget.dataset.tab;
                e.currentTarget.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');
                
                // Load tab data
                this.loadTabData(tab);
            });
        });
    }
    
    setupTouchEvents() {
        // Swipe between tabs on mobile
        let startX = 0;
        let currentTabIndex = 0;
        const tabs = ['console', 'version', 'files', 'settings', 'plugins'];
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            
            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0 && currentTabIndex < tabs.length - 1) {
                    // Swipe left -> next tab
                    currentTabIndex++;
                } else if (diff < 0 && currentTabIndex > 0) {
                    // Swipe right -> previous tab
                    currentTabIndex--;
                }
                
                switchTab(tabs[currentTabIndex]);
            }
        }, { passive: true });
        
        // Prevent context menu on long press for buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }
    
    async checkConnection() {
        try {
            this.updateStatus('⌛ Łączenie...', '#f39c12');
            
            const response = await fetch(`${this.apiUrl}/api/status`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.isConnected = true;
            this.updateConnectionStatus('✅ Połączono', '#2ecc71');
            this.updateStatus(data);
            
            this.elements.lastCheck.textContent = new Date().toLocaleTimeString('pl-PL');
            
        } catch (error) {
            this.isConnected = false;
            this.updateConnectionStatus('❌ Brak połączenia', '#e74c3c');
            this.logToConsole(`Błąd połączenia: ${error.message}`, 'error');
            
            // Retry after 3 seconds
            setTimeout(() => this.checkConnection(), 3000);
        }
    }
    
    async checkStatus() {
        if (!this.isConnected) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/status`);
            const data = await response.json();
            this.updateStatus(data);
            this.elements.lastCheck.textContent = new Date().toLocaleTimeString('pl-PL');
        } catch (error) {
            console.error('Status check failed:', error);
        }
    }
    
    updateStatus(data) {
        const status = data.status || 'unknown';
        
        // Update indicator
        this.elements.statusIndicator.className = 'status-indicator ' + status;
        
        // Update text
        const statusTexts = {
            'running': ['🟢 SERWER DZIAŁA', 'Serwer jest aktywny'],
            'stopped': ['🔴 SERWER ZATRZYMANY', 'Serwer jest wyłączony'],
            'starting': ['🟡 URUCHAMIANIE...', 'Serwer się uruchamia'],
            'stopping': ['🟡 ZATRZYMOWANIE...', 'Serwer się zatrzymuje']
        };
        
        const [title, desc] = statusTexts[status] || ['⚪ STATUS', 'Nieznany status'];
        this.elements.statusTitle.textContent = title;
        this.elements.statusDetails.textContent = desc;
        
        // Update players
        this.elements.playerCount.textContent = data.player_count || data.players?.length || 0;
        
        // Update engine and version
        if (data.engine) this.elements.currentEngine.textContent = data.engine;
        if (data.version) this.elements.currentVersion.textContent = data.version;
        
        // Show logs
        if (data.logs) {
            this.displayLogs(data.logs.slice(-20));
        }
    }
    
    async sendCommand(command) {
        if (!this.isConnected) {
            this.showNotification('Brak połączenia z serwerem', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            const data = await response.json();
            this.showNotification(data.message, data.success ? 'success' : 'error');
            
            // Refresh status after command
            setTimeout(() => this.checkStatus(), 2000);
            
        } catch (error) {
            this.showNotification(`Błąd: ${error.message}`, 'error');
        }
    }
    
    async sendConsoleCommand() {
        const command = this.elements.commandInput.value.trim();
        if (!command || !this.isConnected) return;
        
        this.logToConsole(`> ${command}`, 'system');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            
            const data = await response.json();
            this.logToConsole(data.message, 'info');
            
            this.elements.commandInput.value = '';
            setTimeout(() => this.checkStatus(), 1000);
            
        } catch (error) {
            this.logToConsole(`Błąd: ${error.message}`, 'error');
        }
    }
    
    async selectEngine(engine) {
        document.querySelectorAll('.engine-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.engine === engine);
        });
        
        // Load versions for this engine
        await this.loadVersions(engine);
    }
    
    async loadVersions(engine) {
        try {
            const response = await fetch(`${this.apiUrl}/api/versions/available?engine=${engine}`);
            const data = await response.json();
            
            const select = this.elements.versionSelect;
            select.innerHTML = '';
            
            if (data.versions && data.versions.length > 0) {
                data.versions.forEach(version => {
                    const option = document.createElement('option');
                    option.value = version;
                    option.textContent = version;
                    select.appendChild(option);
                });
                
                // Update Java requirement
                await this.updateJavaInfo(engine, data.versions[0]);
            }
            
        } catch (error) {
            console.error('Failed to load versions:', error);
        }
    }
    
    async updateJavaInfo(engine, version) {
        try {
            const response = await fetch(`${this.apiUrl}/api/java/info?engine=${engine}&version=${version}`);
            const data = await response.json();
            this.elements.javaRequirement.textContent = data.required;
        } catch (error) {
            this.elements.javaRequirement.textContent = 'Java 17+ (szacowane)';
        }
    }
    
    async downloadVersion() {
        const version = this.elements.versionSelect.value;
        if (!version) {
            this.showNotification('Wybierz wersję najpierw', 'error');
            return;
        }
        
        if (!confirm(`Pobrać ${version}? Serwer zostanie zatrzymany.`)) {
            return;
        }
        
        this.elements.downloadProgress.style.display = 'block';
        this.elements.progressText.textContent = 'Rozpoczynanie pobierania...';
        
        try {
            // Show progress
            const progressInterval = setInterval(async () => {
                try {
                    const progressResp = await fetch(`${this.apiUrl}/api/versions/progress`);
                    const progress = await progressResp.json();
                    
                    this.elements.progressFill.style.width = `${progress.progress}%`;
                    this.elements.progressText.textContent = `Pobieranie... ${Math.round(progress.progress)}%`;
                    
                    if (progress.progress >= 100) {
                        clearInterval(progressInterval);
                        this.showNotification('Pobrano pomyślnie!', 'success');
                        setTimeout(() => {
                            this.elements.downloadProgress.style.display = 'none';
                            this.checkStatus();
                        }, 2000);
                    }
                } catch (e) {
                    // Ignore progress errors
                }
            }, 500);
            
            const response = await fetch(`${this.apiUrl}/api/versions/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    engine: document.querySelector('.engine-btn.active').dataset.engine,
                    version: version
                })
            });
            
            if (!response.ok) throw new Error('Download failed');
            
        } catch (error) {
            this.showNotification(`Błąd pobierania: ${error.message}`, 'error');
            this.elements.downloadProgress.style.display = 'none';
        }
    }
    
    async loadTabData(tab) {
        switch(tab) {
            case 'files':
                await this.listFiles(this.currentPath);
                break;
            case 'plugins':
                await this.loadPlugins();
                break;
            case 'version':
                await this.loadVersions('paper');
                break;
        }
    }
    
    async listFiles(path = '/') {
        this.currentPath = path;
        this.elements.filePath.textContent = path;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            let html = '';
            
            // Add parent directory if not root
            if (path !== '/') {
                const parent = path.split('/').slice(0, -1).join('/') || '/';
                html += `
                    <div class="file-item" data-path="${parent}" data-type="folder">
                        <i class="fas fa-folder"></i>
                        <span>.. (wróć)</span>
                    </div>
                `;
            }
            
            // Add files and folders
            (data.files || []).forEach(file => {
                const icon = file.type === 'folder' ? 'fas fa-folder' : 'fas fa-file';
                html += `
                    <div class="file-item" data-path="${file.path}" data-type="${file.type}" data-name="${file.name}">
                        <i class="${icon}"></i>
                        <span>${file.name}</span>
                        ${file.type === 'file' ? `<small>(${this.formatSize(file.size)})</small>` : ''}
                    </div>
                `;
            });
            
            this.elements.fileList.innerHTML = html || '<p style="color: var(--gray); text-align: center;">Pusty folder</p>';
            
            // Add click listeners
            this.elements.fileList.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', () => {
                    const path = item.dataset.path;
                    const type = item.dataset.type;
                    
                    if (type === 'folder') {
                        this.listFiles(path);
                    } else {
                        this.openFile(path, item.dataset.name);
                    }
                });
            });
            
        } catch (error) {
            this.showNotification(`Błąd ładowania plików: ${error.message}`, 'error');
        }
    }
    
    async openFile(path, name) {
        try {
            const response = await fetch(`${this.apiUrl}/api/files/read?file=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            this.currentFile = { path, name, content: data.content };
            this.elements.fileContent.value = data.content;
            this.elements.saveFileBtn.style.display = 'block';
            
        } catch (error) {
            this.showNotification(`Nie można otworzyć pliku: ${error.message}`, 'error');
        }
    }
    
    async saveFile() {
        if (!this.currentFile) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: this.currentFile.path,
                    content: this.elements.fileContent.value
                })
            });
            
            const data = await response.json();
            this.showNotification(data.success ? 'Zapisano!' : data.error, 
                                data.success ? 'success' : 'error');
            
        } catch (error) {
            this.showNotification(`Błąd zapisu: ${error.message}`, 'error');
        }
    }
    
    navigateUp() {
        if (this.currentPath !== '/') {
            const parent = this.currentPath.split('/').slice(0, -1).join('/') || '/';
            this.listFiles(parent);
        }
    }
    
    async deleteFile() {
        if (!this.currentFile || !confirm('Usunąć ten plik?')) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: this.currentFile.path })
            });
            
            const data = await response.json();
            this.showNotification(data.success ? 'Usunięto!' : data.error, 
                                data.success ? 'success' : 'error');
            
            if (data.success) {
                this.currentFile = null;
                this.elements.fileContent.value = '';
                this.elements.saveFileBtn.style.display = 'none';
                this.listFiles(this.currentPath);
            }
            
        } catch (error) {
            this.showNotification(`Błąd usuwania: ${error.message}`, 'error');
        }
    }
    
    async uploadFiles(files) {
        if (!files.length) return;
        
        const formData = new FormData();
        for (let file of files) {
            formData.append('file', file);
        }
        formData.append('folder', this.currentPath);
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            this.showNotification(data.success ? 'Wgrano!' : data.error, 
                                data.success ? 'success' : 'error');
            
            if (data.success) {
                this.listFiles(this.currentPath);
            }
            
        } catch (error) {
            this.showNotification(`Błąd wgrywania: ${error.message}`, 'error');
        }
    }
    
    async loadPlugins() {
        try {
            const response = await fetch(`${this.apiUrl}/api/plugins/list`);
            const data = await response.json();
            
            let html = '';
            (data.plugins || []).forEach(plugin => {
                html += `
                    <div style="padding: 10px; background: rgba(0,0,0,0.2); 
                               margin-bottom: 5px; border-radius: 5px;">
                        <strong>${plugin.name}</strong>
                        <small style="color: var(--gray); display: block;">
                            ${this.formatSize(plugin.size)}
                        </small>
                    </div>
                `;
            });
            
            this.elements.pluginsList.innerHTML = html || 
                '<p style="color: var(--gray); text-align: center;">Brak pluginów</p>';
            
        } catch (error) {
            console.error('Failed to load plugins:', error);
        }
    }
    
    async uploadPlugins(files) {
        const jarFiles = Array.from(files).filter(f => f.name.endsWith('.jar'));
        if (!jarFiles.length) return;
        
        const formData = new FormData();
        jarFiles.forEach(file => formData.append('file', file));
        formData.append('folder', 'plugins');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            this.showNotification(data.success ? 
                `Wgrano ${jarFiles.length} plugin(ów)` : data.error, 
                data.success ? 'success' : 'error');
            
            if (data.success) {
                this.loadPlugins();
            }
            
        } catch (error) {
            this.showNotification(`Błąd wgrywania pluginów: ${error.message}`, 'error');
        }
    }
    
    async saveSettings() {
        const settings = {
            'max-players': document.getElementById('maxPlayers').value,
            'gamemode': document.getElementById('gamemode').value,
            'difficulty': document.getElementById('difficulty').value,
            'view-distance': document.getElementById('viewDistance').value,
            'motd': document.getElementById('motd').value,
            'pvp': document.getElementById('pvp').checked ? 'true' : 'false',
            'enable-command-block': document.getElementById('commandBlocks').checked ? 'true' : 'false',
            'online-mode': document.getElementById('onlineMode').checked ? 'true' : 'false',
            'white-list': document.getElementById('whiteList').checked ? 'true' : 'false'
        };
        
        const password = document.getElementById('serverPassword').value;
        if (password) {
            settings['rcon.password'] = password;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/api/server/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            });
            
            const data = await response.json();
            this.showNotification(data.success ? 'Zapisano ustawienia!' : data.error, 
                                data.success ? 'success' : 'error');
            
        } catch (error) {
            this.showNotification(`Błąd zapisu: ${error.message}`, 'error');
        }
    }
    
    // Helper methods
    displayLogs(logs) {
        const consoleEl = this.elements.consoleOutput;
        const loading = consoleEl.querySelector('.loading');
        if (loading) loading.style.display = 'none';
        
        let html = '';
        logs.forEach(log => {
            const type = this.getLogType(log);
            html += `<div style="color: ${type === 'error' ? '#ff6b6b' : type === 'warning' ? '#f1c40f' : '#00ff9d'}; 
                               margin-bottom: 3px; font-family: monospace; font-size: 12px;">
                        ${this.escapeHtml(log)}
                     </div>`;
        });
        
        consoleEl.innerHTML = html;
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
    
    logToConsole(message, type = 'info') {
        const consoleEl = this.elements.consoleOutput;
        const loading = consoleEl.querySelector('.loading');
        if (loading) loading.style.display = 'none';
        
        const color = type === 'error' ? '#ff6b6b' : type === 'warning' ? '#f1c40f' : '#00ff9d';
        const div = document.createElement('div');
        div.style.cssText = `color: ${color}; margin-bottom: 3px; font-family: monospace; font-size: 12px;`;
        div.textContent = `[${new Date().toLocaleTimeString('pl-PL')}] ${message}`;
        
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        
        // Limit to 100 lines
        while (consoleEl.children.length > 100) {
            consoleEl.removeChild(consoleEl.firstChild);
        }
    }
    
    clearConsole() {
        this.elements.consoleOutput.innerHTML = 
            '<div class="loading"><div class="spinner"></div><p>Konsola wyczyszczona</p></div>';
    }
    
    updateConnectionStatus(text, color) {
        const el = this.elements.connectionStatus;
        el.textContent = ` ${text}`;
        el.className = `connection-status ${text.includes('Połączono') ? 'status-connected' : 'status-disconnected'}`;
        el.style.backgroundColor = color + '20';
        el.style.color = color;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    getLogType(log) {
        const l = log.toLowerCase();
        if (l.includes('error') || l.includes('failed')) return 'error';
        if (l.includes('warning') || l.includes('warn')) return 'warning';
        return 'info';
    }
    
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Fix iOS viewport height
    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Start controller
    window.controller = new MobileMinecraftController();
    
    console.log('📱 Mobile Minecraft Controller loaded!');
});
