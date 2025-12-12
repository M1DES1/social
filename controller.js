class AdvancedMinecraftController {
    constructor() {
        // Konfiguracja
        this.apiUrl = "https://turbo-fortnight-wr757r5wr7wrfgw75-5001.app.github.dev/";
        
        // Stany
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.isConnected = false;
        this.lastUpdate = null;
        this.currentEngine = "paper";
        this.currentVersion = "1.20.4";
        this.currentFilePath = "";
        this.fileContentOriginal = "";
        
        // Cache danych
        this.availableVersions = {};
        this.fileCache = {};
        
        // Elementy DOM
        this.elements = {
            // Status
            statusPanel: document.getElementById('statusPanel'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusTitle: document.getElementById('statusTitle'),
            statusDetails: document.getElementById('statusDetails'),
            playerCount: document.getElementById('playerCount'),
            currentEngine: document.getElementById('currentEngine'),
            currentVersion: document.getElementById('currentVersion'),
            
            // Control buttons
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            restartBtn: document.getElementById('restartBtn'),
            
            // Console
            consoleOutput: document.getElementById('consoleOutput'),
            commandInput: document.getElementById('commandInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshConsoleBtn: document.getElementById('refreshConsoleBtn'),
            autoRefreshCheckbox: document.getElementById('autoRefresh'),
            
            // Version Manager
            engineButtons: document.querySelectorAll('.engine-btn'),
            engineInfo: document.getElementById('engineInfo'),
            versionSelect: document.getElementById('versionSelect'),
            downloadVersionBtn: document.getElementById('downloadVersionBtn'),
            javaRequirement: document.getElementById('javaRequirement'),
            downloadProgress: document.getElementById('downloadProgress'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            // File Manager
            refreshFilesBtn: document.getElementById('refreshFilesBtn'),
            uploadFileBtn: document.getElementById('uploadFileBtn'),
            newFolderBtn: document.getElementById('newFolderBtn'),
            deleteFileBtn: document.getElementById('deleteFileBtn'),
            currentPath: document.getElementById('currentPath'),
            fileList: document.getElementById('fileList'),
            fileName: document.getElementById('fileName'),
            fileContent: document.getElementById('fileContent'),
            saveFileBtn: document.getElementById('saveFileBtn'),
            downloadFileBtn: document.getElementById('downloadFileBtn'),
            revertFileBtn: document.getElementById('revertFileBtn'),
            editorButtons: document.getElementById('editorButtons'),
            realFileUpload: document.getElementById('realFileUpload'),
            
            // Plugins
            browsePluginsBtn: document.getElementById('browsePluginsBtn'),
            pluginUpload: document.getElementById('pluginUpload'),
            pluginsList: document.getElementById('pluginsList'),
            
            // Connection
            connectionStatus: document.getElementById('connectionStatus'),
            backendUrl: document.getElementById('backendUrl'),
            lastCheck: document.getElementById('lastCheck'),
            
            // Tabs
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabPanes: {
                console: document.getElementById('console-tab'),
                version: document.getElementById('version-tab'),
                files: document.getElementById('files-tab'),
                plugins: document.getElementById('plugins-tab')
            }
        };
        
        this.init();
    }
    
    init() {
        this.elements.backendUrl.textContent = this.apiUrl;
        this.setupEventListeners();
        this.setupTabs();
        this.checkConnection();
        this.startAutoRefresh();
        
        // Ukryj loading spinnery
        setTimeout(() => {
            document.querySelectorAll('.loading').forEach(el => {
                el.style.display = 'none';
            });
        }, 1000);
        
        this.logToConsole(`🔗 Connecting to: ${this.apiUrl}`, 'system');
    }
    
    setupEventListeners() {
        // === PODSTAWOWE KONTROLE ===
        this.elements.startBtn.addEventListener('click', () => this.sendCommand('start'));
        this.elements.stopBtn.addEventListener('click', () => this.sendCommand('stop'));
        this.elements.restartBtn.addEventListener('click', () => this.sendCommand('restart'));
        
        this.elements.sendBtn.addEventListener('click', () => this.sendCustomCommand());
        this.elements.clearBtn.addEventListener('click', () => this.clearConsole());
        this.elements.refreshConsoleBtn.addEventListener('click', () => this.checkStatus());
        
        this.elements.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendCustomCommand();
        });
        
        this.elements.autoRefreshCheckbox.addEventListener('change', (e) => {
            this.autoRefresh = e.target.checked;
            if (this.autoRefresh) {
                this.startAutoRefresh();
            } else {
                this.stopAutoRefresh();
            }
        });
        
        // === MANAGER WERSJI ===
        this.elements.engineButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const engine = e.target.dataset.engine;
                this.selectEngine(engine);
            });
        });
        
        this.elements.versionSelect.addEventListener('change', (e) => {
            this.updateJavaRequirement(e.target.value);
        });
        
        this.elements.downloadVersionBtn.addEventListener('click', () => {
            this.downloadVersion();
        });
        
        // === MANAGER PLIKÓW ===
        this.elements.refreshFilesBtn.addEventListener('click', () => {
            this.listFiles(this.currentFilePath || '/');
        });
        
        this.elements.uploadFileBtn.addEventListener('click', () => {
            this.elements.realFileUpload.click();
        });
        
        this.elements.realFileUpload.addEventListener('change', (e) => {
            this.uploadFiles(e.target.files);
        });
        
        this.elements.newFolderBtn.addEventListener('click', () => {
            this.createNewFolder();
        });
        
        this.elements.deleteFileBtn.addEventListener('click', () => {
            this.deleteSelectedFile();
        });
        
        this.elements.saveFileBtn.addEventListener('click', () => {
            this.saveFile();
        });
        
        this.elements.downloadFileBtn.addEventListener('click', () => {
            this.downloadFile();
        });
        
        this.elements.revertFileBtn.addEventListener('click', () => {
            this.revertFile();
        });
        
        this.elements.fileContent.addEventListener('input', () => {
            this.checkFileChanges();
        });
        
        // === PLUGINY ===
        this.elements.browsePluginsBtn.addEventListener('click', () => {
            this.elements.pluginUpload.click();
        });
        
        this.elements.pluginUpload.addEventListener('change', (e) => {
            this.uploadPlugins(e.target.files);
        });
    }
    
    setupTabs() {
        this.elements.tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Ukryj wszystkie panele
                Object.values(this.elements.tabPanes).forEach(pane => {
                    pane.classList.remove('active');
                });
                
                // Usuń active ze wszystkich przycisków
                this.elements.tabButtons.forEach(b => b.classList.remove('active'));
                
                // Aktywuj wybrany
                const tab = e.target.dataset.tab;
                e.target.classList.add('active');
                this.elements.tabPanes[tab].classList.add('active');
                
                // Załaduj dane dla zakładki
                switch(tab) {
                    case 'version':
                        this.loadAvailableVersions(this.currentEngine);
                        break;
                    case 'files':
                        this.listFiles('/');
                        break;
                    case 'plugins':
                        this.loadPlugins();
                        break;
                }
            });
        });
    }
    
    // ========== PODSTAWOWE FUNKCJE ==========
    
    async checkConnection() {
        try {
            this.updateConnectionStatus('⌛ Testing connection...', '#f39c12');
            
            const response = await fetch(`${this.apiUrl}/api/status`);
            
            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                this.updateConnectionStatus('✅ Connected', '#2ecc71');
                this.logToConsole('✓ Connected to backend!', 'system');
                this.updateStatus(data);
                
                this.lastUpdate = new Date();
                this.elements.lastCheck.textContent = this.lastUpdate.toLocaleTimeString('pl-PL');
                
                // Zaktualizuj info o silniku i wersji
                if (data.engine && data.version) {
                    this.currentEngine = data.engine;
                    this.currentVersion = data.version;
                    this.elements.currentEngine.textContent = data.engine;
                    this.elements.currentVersion.textContent = data.version;
                }
                
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('Connection error:', error);
            this.isConnected = false;
            this.updateConnectionStatus('❌ Disconnected', '#e74c3c');
            this.logToConsole(`✗ Error: ${error.message}`, 'error');
            this.updateStatus({ status: 'disconnected' });
            
            setTimeout(() => this.checkConnection(), 3000);
        }
    }
    
    async checkStatus() {
        if (!this.isConnected) {
            await this.checkConnection();
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/api/status`);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.updateStatus(data);
            this.lastUpdate = new Date();
            this.elements.lastCheck.textContent = this.lastUpdate.toLocaleTimeString('pl-PL');
            
        } catch (error) {
            this.logToConsole(`Status check error: ${error.message}`, 'error');
            this.updateConnectionStatus('⚠️ Connection error', '#e74c3c');
            this.isConnected = false;
        }
    }
    
    async sendCommand(command) {
        if (!this.isConnected) {
            this.logToConsole('Not connected to backend!', 'error');
            return;
        }
        
        const button = this.elements[`${command}Btn`];
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';
        button.disabled = true;
        
        this.logToConsole(`Sending command: ${command}`, 'system');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.logToConsole(`✅ ${data.message}`, 'info');
            
            setTimeout(() => {
                this.checkStatus();
            }, 2000);
            
        } catch (error) {
            this.logToConsole(`❌ Error: ${error.message}`, 'error');
        } finally {
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 1500);
        }
    }
    
    async sendCustomCommand() {
        const command = this.elements.commandInput.value.trim();
        if (!command) return;
        
        if (!this.isConnected) {
            this.logToConsole('Not connected!', 'error');
            return;
        }
        
        this.logToConsole(`[USER] > ${command}`, 'system');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.logToConsole(`[RESPONSE] ${data.message}`, 'info');
            
            this.elements.commandInput.value = '';
            setTimeout(() => this.checkStatus(), 1000);
            
        } catch (error) {
            this.logToConsole(`❌ Send error: ${error.message}`, 'error');
        }
    }
    
    updateStatus(data) {
        const status = data.status || 'unknown';
        
        // Aktualizuj wskaźnik
        this.elements.statusIndicator.className = 'status-indicator ' + status;
        
        // Aktualizuj tekst
        const statusConfig = {
            'running': {
                title: '🟢 SERVER RUNNING',
                details: 'Minecraft server is active',
                color: '#2ecc71'
            },
            'stopped': {
                title: '🔴 SERVER STOPPED',
                details: 'Server is stopped',
                color: '#e74c3c'
            },
            'starting': {
                title: '🟡 STARTING...',
                details: 'Server is starting up',
                color: '#f39c12'
            },
            'stopping': {
                title: '🟡 STOPPING...',
                details: 'Server is stopping',
                color: '#f39c12'
            },
            'disconnected': {
                title: '⚪ DISCONNECTED',
                details: 'Cannot connect to backend',
                color: '#95a5a6'
            }
        };
        
        const config = statusConfig[status] || {
            title: '⚫ UNKNOWN STATUS',
            details: 'Cannot determine status',
            color: '#95a5a6'
        };
        
        this.elements.statusTitle.textContent = config.title;
        this.elements.statusDetails.textContent = config.details;
        this.elements.statusTitle.style.color = config.color;
        
        // Gracze
        const playerCount = data.player_count || data.players?.length || 0;
        this.elements.playerCount.textContent = playerCount;
        
        // Silnik i wersja
        if (data.engine) {
            this.elements.currentEngine.textContent = data.engine;
            this.currentEngine = data.engine;
        }
        if (data.version) {
            this.elements.currentVersion.textContent = data.version;
            this.currentVersion = data.version;
        }
        
        // Logi
        if (data.logs && data.logs.length > 0) {
            this.displayLogs(data.logs);
        }
    }
    
    displayLogs(logs) {
        const consoleEl = this.elements.consoleOutput;
        
        // Sprawdź czy już mamy te logi
        const currentContent = consoleEl.innerHTML;
        const newLogsHtml = logs.map(log => {
            const type = this.determineLogType(log);
            return `<div class="log-line ${type}">${this.escapeHtml(log)}</div>`;
        }).join('');
        
        if (currentContent !== newLogsHtml) {
            consoleEl.innerHTML = newLogsHtml;
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
    }
    
    logToConsole(message, type = 'info') {
        const consoleEl = this.elements.consoleOutput;
        
        // Usuń loading spinner
        const loading = consoleEl.querySelector('.loading');
        if (loading) loading.style.display = 'none';
        
        const timestamp = new Date().toLocaleTimeString('pl-PL');
        const logEntry = `[${timestamp}] ${message}`;
        
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        line.textContent = logEntry;
        
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        
        // Ogranicz do 300 linii
        const lines = consoleEl.children;
        if (lines.length > 300) {
            for (let i = 0; i < lines.length - 300; i++) {
                consoleEl.removeChild(lines[i]);
            }
        }
    }
    
    clearConsole() {
        this.elements.consoleOutput.innerHTML = '';
        this.logToConsole('Console cleared', 'system');
    }
    
    updateConnectionStatus(text, color) {
        const statusEl = this.elements.connectionStatus;
        statusEl.textContent = ` ${text}`;
        statusEl.className = text.includes('Connected') ? 
            'connection-status status-connected' : 
            'connection-status status-disconnected';
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        
        this.refreshInterval = setInterval(() => {
            if (this.autoRefresh && this.isConnected) {
                this.checkStatus();
            }
        }, 5000);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    // ========== MANAGER WERSJI ==========
    
    async selectEngine(engine) {
        this.currentEngine = engine;
        
        // Aktualizuj przyciski
        this.elements.engineButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.engine === engine);
        });
        
        // Aktualizuj informacje
        const engineInfo = {
            vanilla: "Vanilla is the official Minecraft server. Simple but with limited performance optimizations.",
            paper: "Paper is recommended for most servers - better performance, plugin support, and regular updates.",
            forge: "Forge enables modding support. Requires mods to be installed on both server and client."
        };
        
        this.elements.engineInfo.innerHTML = `<strong>${engine.charAt(0).toUpperCase() + engine.slice(1)}</strong> ${engineInfo[engine]}`;
        
        // Załaduj wersje dla tego silnika
        await this.loadAvailableVersions(engine);
    }
    
    async loadAvailableVersions(engine = this.currentEngine) {
        try {
            this.logToConsole(`Loading versions for ${engine}...`, 'system');
            
            const response = await fetch(`${this.apiUrl}/api/versions/available?engine=${engine}`);
            const data = await response.json();
            
            this.availableVersions[engine] = data.versions || [];
            
            // Wypełnij dropdown
            const select = this.elements.versionSelect;
            select.innerHTML = '';
            
            if (data.versions && data.versions.length > 0) {
                data.versions.forEach(version => {
                    const option = document.createElement('option');
                    option.value = version;
                    option.textContent = version;
                    select.appendChild(option);
                });
                
                // Wybierz najnowszą lub aktualną
                const currentVersion = data.latest || data.versions[data.versions.length - 1];
                select.value = currentVersion;
                
                this.updateJavaRequirement(currentVersion);
            } else {
                select.innerHTML = '<option value="">No versions available</option>';
            }
            
        } catch (error) {
            this.logToConsole(`Failed to load versions: ${error.message}`, 'error');
            this.elements.versionSelect.innerHTML = '<option value="">Error loading versions</option>';
        }
    }
    
    async updateJavaRequirement(version) {
        try {
            const response = await fetch(`${this.apiUrl}/api/java/info?version=${version}&engine=${this.currentEngine}`);
            const data = await response.json();
            
            this.elements.javaRequirement.innerHTML = `
                <strong>Java Requirement:</strong> ${data.required}
                ${data.installed.includes(data.required) ? 
                    ' <span style="color:#2ecc71">(✓ Available)</span>' : 
                    ' <span style="color:#e74c3c">(✗ May need update)</span>'}
            `;
            
        } catch (error) {
            this.elements.javaRequirement.innerHTML = `<strong>Java Requirement:</strong> Java 17+ (estimated)`;
        }
    }
    
    async downloadVersion() {
        const version = this.elements.versionSelect.value;
        if (!version) {
            this.showNotification('Please select a version first', 'error');
            return;
        }
        
        if (!this.isConnected) {
            this.showNotification('Not connected to backend', 'error');
            return;
        }
        
        // Potwierdzenie
        if (!confirm(`Download and install ${this.currentEngine} ${version}?\nThis will stop the server if it's running.`)) {
            return;
        }
        
        this.elements.downloadProgress.style.display = 'block';
        this.elements.progressFill.style.width = '0%';
        this.elements.progressText.textContent = 'Starting download...';
        
        this.logToConsole(`Downloading ${this.currentEngine} ${version}...`, 'system');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/versions/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    engine: this.currentEngine,
                    version: version
                })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            // Śledź postęp
            const progressInterval = setInterval(async () => {
                try {
                    const progressResp = await fetch(`${this.apiUrl}/api/versions/progress`);
                    const progressData = await progressResp.json();
                    
                    this.elements.progressFill.style.width = `${progressData.progress}%`;
                    this.elements.progressText.textContent = `Downloading... ${Math.round(progressData.progress)}%`;
                    
                    if (progressData.progress >= 100) {
                        clearInterval(progressInterval);
                        
                        const data = await response.json();
                        this.showNotification(`✅ Downloaded ${this.currentEngine} ${version}`, 'success');
                        this.logToConsole(`✅ ${data.message}`, 'info');
                        
                        // Zaktualizuj status
                        this.currentVersion = version;
                        this.elements.currentVersion.textContent = version;
                        this.checkStatus();
                        
                        setTimeout(() => {
                            this.elements.downloadProgress.style.display = 'none';
                        }, 2000);
                    }
                } catch (e) {
                    // Ignore progress errors
                }
            }, 500);
            
        } catch (error) {
            this.showNotification(`Download failed: ${error.message}`, 'error');
            this.logToConsole(`❌ Download error: ${error.message}`, 'error');
            this.elements.downloadProgress.style.display = 'none';
        }
    }
    
    // ========== MANAGER PLIKÓW ==========
    
    async listFiles(path = '/') {
        this.currentFilePath = path;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/list?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.error) {
                this.showNotification(data.error, 'error');
                return;
            }
            
            this.elements.currentPath.textContent = `Current Path: ${data.path || '/'}`;
            this.displayFileList(data.files || []);
            
        } catch (error) {
            this.showNotification(`Failed to list files: ${error.message}`, 'error');
            this.logToConsole(`File list error: ${error.message}`, 'error');
        }
    }
    
    displayFileList(files) {
        const fileListEl = this.elements.fileList;
        
        if (files.length === 0) {
            fileListEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #a0a0ff;">
                    <i class="fas fa-folder-open" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>This folder is empty</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        // Dodaj nawigację wstecz jeśli nie jesteśmy w root
        if (this.currentFilePath && this.currentFilePath !== '/') {
            const parentPath = this.currentFilePath.split('/').slice(0, -1).join('/') || '/';
            html += `
                <div class="file-item" data-path="${parentPath}" data-type="folder" data-name="..">
                    <div class="file-icon"><i class="fas fa-level-up-alt"></i></div>
                    <div class="file-name">.. (Parent)</div>
                    <div class="file-size"></div>
                </div>
            `;
        }
        
        // Dodaj pliki i foldery
        files.forEach(file => {
            const icon = file.type === 'folder' ? 'fas fa-folder' : this.getFileIcon(file.name);
            const size = file.type === 'folder' ? '' : this.formatFileSize(file.size);
            
            html += `
                <div class="file-item" 
                     data-path="${file.path}" 
                     data-type="${file.type}" 
                     data-name="${file.name}">
                    <div class="file-icon"><i class="${icon}"></i></div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${size}</div>
                </div>
            `;
        });
        
        fileListEl.innerHTML = html;
        
        // Dodaj event listenery
        fileListEl.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.file-item')) {
                    const path = item.dataset.path;
                    const type = item.dataset.type;
                    const name = item.dataset.name;
                    
                    if (type === 'folder') {
                        this.listFiles(path);
                    } else {
                        this.openFile(path, name);
                    }
                }
            });
            
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                // TODO: Menu kontekstowe
            });
        });
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        switch(ext) {
            case 'jar': return 'fas fa-archive';
            case 'yml': case 'yaml': case 'properties': case 'json': case 'txt': case 'log':
                return 'fas fa-file-alt';
            case 'zip': case 'tar': case 'gz': return 'fas fa-file-archive';
            case 'png': case 'jpg': case 'jpeg': case 'gif': return 'fas fa-file-image';
            case 'dat': case 'mca': case 'mcr': return 'fas fa-database';
            default: return 'fas fa-file';
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async openFile(path, name) {
        try {
            const response = await fetch(`${this.apiUrl}/api/files/read?file=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.error) {
                this.showNotification(data.error, 'error');
                return;
            }
            
            this.currentFilePath = path;
            this.fileContentOriginal = data.content;
            
            this.elements.fileName.textContent = name;
            this.elements.fileContent.value = data.content;
            this.elements.saveFileBtn.style.display = 'block';
            this.elements.editorButtons.style.display = 'flex';
            
            this.checkFileChanges();
            
        } catch (error) {
            this.showNotification(`Failed to read file: ${error.message}`, 'error');
        }
    }
    
    async saveFile() {
        if (!this.currentFilePath) return;
        
        const content = this.elements.fileContent.value;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: this.currentFilePath,
                    content: content
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('File saved successfully', 'success');
                this.fileContentOriginal = content;
                this.checkFileChanges();
            } else {
                this.showNotification(`Save failed: ${data.error}`, 'error');
            }
            
        } catch (error) {
            this.showNotification(`Save error: ${error.message}`, 'error');
        }
    }
    
    async downloadFile() {
        if (!this.currentFilePath) return;
        
        const link = document.createElement('a');
        link.href = `${this.apiUrl}/api/files/download/${encodeURIComponent(this.currentFilePath)}`;
        link.download = this.currentFilePath.split('/').pop();
        link.click();
    }
    
    revertFile() {
        if (confirm('Revert to original content?')) {
            this.elements.fileContent.value = this.fileContentOriginal;
            this.checkFileChanges();
        }
    }
    
    checkFileChanges() {
        const hasChanges = this.elements.fileContent.value !== this.fileContentOriginal;
        this.elements.saveFileBtn.disabled = !hasChanges;
        this.elements.saveFileBtn.innerHTML = hasChanges ? 
            '<i class="fas fa-save"></i> Save Changes' : 
            '<i class="fas fa-check"></i> Saved';
    }
    
    async uploadFiles(files) {
        if (!files || files.length === 0) return;
        
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('file', files[i]);
        }
        formData.append('folder', this.currentFilePath);
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Uploaded ${files.length} file(s)`, 'success');
                this.listFiles(this.currentFilePath);
            } else {
                this.showNotification(`Upload failed: ${data.error}`, 'error');
            }
            
        } catch (error) {
            this.showNotification(`Upload error: ${error.message}`, 'error');
        }
    }
    
    async createNewFolder() {
        const name = prompt('Enter folder name:');
        if (!name) return;
        
        // W backendzie to trzeba będzie dodać
        this.showNotification('Folder creation not implemented in backend yet', 'warning');
    }
    
    async deleteSelectedFile() {
        if (!this.currentFilePath) {
            this.showNotification('No file selected', 'error');
            return;
        }
        
        if (!confirm(`Delete ${this.currentFilePath.split('/').pop()}?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: this.currentFilePath })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('File deleted', 'success');
                this.listFiles(this.currentFilePath.split('/').slice(0, -1).join('/') || '/');
                this.elements.fileContent.value = '';
                this.elements.saveFileBtn.style.display = 'none';
                this.elements.editorButtons.style.display = 'none';
            } else {
                this.showNotification(`Delete failed: ${data.error}`, 'error');
            }
            
        } catch (error) {
            this.showNotification(`Delete error: ${error.message}`, 'error');
        }
    }
    
    // ========== PLUGIN MANAGER ==========
    
    async loadPlugins() {
        try {
            const response = await fetch(`${this.apiUrl}/api/plugins/list`);
            const data = await response.json();
            
            this.displayPlugins(data.plugins || []);
            
        } catch (error) {
            this.showNotification(`Failed to load plugins: ${error.message}`, 'error');
        }
    }
    
    displayPlugins(plugins) {
        const pluginsListEl = this.elements.pluginsList;
        
        if (plugins.length === 0) {
            pluginsListEl.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #a0a0ff;">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>No plugins installed</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: grid; gap: 10px;">';
        
        plugins.forEach(plugin => {
            const size = this.formatFileSize(plugin.size);
            const modified = new Date(plugin.modified * 1000).toLocaleDateString();
            
            html += `
                <div style="background: rgba(30, 30, 60, 0.8); padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #4a9eff;">${plugin.name}</strong>
                            <div style="color: #a0a0ff; font-size: 0.9rem;">
                                ${size} • Modified: ${modified}
                            </div>
                        </div>
                        <button class="btn-small" style="background: #e74c3c; padding: 8px 15px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        pluginsListEl.innerHTML = html;
    }
    
    async uploadPlugins(files) {
        if (!files || files.length === 0) return;
        
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            if (files[i].name.endsWith('.jar')) {
                formData.append('file', files[i]);
            }
        }
        formData.append('folder', 'plugins');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/files/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Uploaded ${files.length} plugin(s)`, 'success');
                this.loadPlugins();
            } else {
                this.showNotification(`Upload failed: ${data.error}`, 'error');
            }
            
        } catch (error) {
            this.showNotification(`Upload error: ${error.message}`, 'error');
        }
    }
    
    // ========== POMOCNICZE ==========
    
    determineLogType(log) {
        const lower = log.toLowerCase();
        if (lower.includes('error') || lower.includes('failed') || lower.includes('exception')) {
            return 'error';
        } else if (lower.includes('warning') || lower.includes('warn')) {
            return 'warning';
        } else if (lower.includes('[info]') || lower.includes('[system]')) {
            return 'info';
        } else if (lower.includes('joined') || lower.includes('left') || lower.includes('player')) {
            return 'system';
        }
        return 'info';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Start controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mcController = new AdvancedMinecraftController();
    
    console.log('🎮 Advanced Minecraft Controller loaded!');
    console.log('Backend URL:', window.mcController.apiUrl);
});
