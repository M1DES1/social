class MinecraftController {
    constructor() {
        // 🔧 TU WPISZ SWÓJ ADRES Z CODESPACES
        this.apiUrl = "https://turbo-fortnight-wr757r5wr7wrfgw75-8080.app.github.dev";
        
        this.autoRefresh = true;
        this.refreshInterval = null;
        this.isConnected = false;
        this.lastUpdate = null;
        
        this.elements = {
            statusPanel: document.getElementById('statusPanel'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusTitle: document.getElementById('statusTitle'),
            statusDetails: document.getElementById('statusDetails'),
            playerCount: document.getElementById('playerCount'),
            
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            restartBtn: document.getElementById('restartBtn'),
            
            consoleOutput: document.getElementById('consoleOutput'),
            commandInput: document.getElementById('commandInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            autoRefreshCheckbox: document.getElementById('autoRefresh'),
            
            connectionStatus: document.getElementById('connectionStatus'),
            backendUrl: document.getElementById('backendUrl'),
            lastCheck: document.getElementById('lastCheck')
        };
        
        this.init();
    }
    
    init() {
        this.elements.backendUrl.textContent = this.apiUrl;
        this.setupEventListeners();
        this.checkConnection();
        this.startAutoRefresh();
        
        // Ukryj loading spinner po 2 sekundach
        setTimeout(() => {
            const loading = document.querySelector('.loading');
            if (loading && loading.parentNode === this.elements.consoleOutput) {
                loading.style.display = 'none';
            }
        }, 2000);
    }
    
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.sendCommand('start'));
        this.elements.stopBtn.addEventListener('click', () => this.sendCommand('stop'));
        this.elements.restartBtn.addEventListener('click', () => this.sendCommand('restart'));
        
        this.elements.sendBtn.addEventListener('click', () => this.sendCustomCommand());
        this.elements.clearBtn.addEventListener('click', () => this.clearConsole());
        this.elements.refreshBtn.addEventListener('click', () => this.checkStatus());
        
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
    }
    
    async checkConnection() {
        try {
            this.updateConnectionStatus('⌛ Testowanie połączenia...', '#f39c12');
            
            const response = await fetch(`${this.apiUrl}/api/status`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                this.updateConnectionStatus('✅ Połączono', '#2ecc71');
                this.logToConsole('✓ Połączono z serwerem kontrolera Minecraft', 'system');
                this.updateStatus(data);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
            this.isConnected = false;
            this.updateConnectionStatus('❌ Brak połączenia', '#e74c3c');
            this.logToConsole(`✗ Błąd połączenia: ${error.message}`, 'error');
            this.updateStatus({ status: 'disconnected' });
        }
    }
    
    async checkStatus() {
        if (!this.isConnected) {
            await this.checkConnection();
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/api/status`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.updateStatus(data);
            this.lastUpdate = new Date();
            this.elements.lastCheck.textContent = this.lastUpdate.toLocaleTimeString('pl-PL');
            
        } catch (error) {
            this.logToConsole(`Błąd pobierania statusu: ${error.message}`, 'error');
            this.updateConnectionStatus('⚠️ Błąd połączenia', '#e74c3c');
            this.isConnected = false;
        }
    }
    
    async sendCommand(command) {
        if (!this.isConnected) {
            this.logToConsole('Brak połączenia z backendem!', 'error');
            this.updateConnectionStatus('❌ Brak połączenia', '#e74c3c');
            return;
        }
        
        // Zapisz oryginalny stan przycisku
        const button = this.elements[`${command}Btn`];
        const originalText = button.innerHTML;
        const originalDisabled = button.disabled;
        
        // Aktualizuj przycisk
        button.innerHTML = '<span>⏳</span> WYSYŁANIE...';
        button.disabled = true;
        
        this.logToConsole(`Wysyłanie komendy: ${command}`, 'system');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ command: command })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.logToConsole(`✓ ${data.message}`, 'info');
            
            // Odśwież status po 2 sekundach
            setTimeout(() => {
                this.checkStatus();
            }, 2000);
            
        } catch (error) {
            this.logToConsole(`✗ Błąd: ${error.message}`, 'error');
            this.updateConnectionStatus('⚠️ Błąd wysyłania', '#e74c3c');
        } finally {
            // Przywróć przycisk po 1.5 sekundy
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = originalDisabled;
            }, 1500);
        }
    }
    
    async sendCustomCommand() {
        const command = this.elements.commandInput.value.trim();
        if (!command) return;
        
        if (!this.isConnected) {
            this.logToConsole('Brak połączenia!', 'error');
            return;
        }
        
        this.logToConsole(`[UŻYTKOWNIK] > ${command}`, 'system');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command: command })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.logToConsole(`[ODPOWIEDŹ] ${data.message}`, 'info');
            
            // Wyczyść pole i odśwież
            this.elements.commandInput.value = '';
            setTimeout(() => this.checkStatus(), 1000);
            
        } catch (error) {
            this.logToConsole(`✗ Błąd wysyłania: ${error.message}`, 'error');
        }
    }
    
    async fetchLogs() {
        if (!this.isConnected) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/logs?count=30`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            if (data.logs && data.logs.length > 0) {
                this.displayLogs(data.logs);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    }
    
    updateStatus(data) {
        const status = data.status || 'unknown';
        
        // Aktualizuj wskaźnik statusu
        this.elements.statusIndicator.className = 'status-indicator ' + status;
        
        // Aktualizuj tekst statusu
        const statusConfig = {
            'running': {
                title: '🟢 SERWER DZIAŁA',
                details: 'Serwer Minecraft jest aktywny',
                color: '#2ecc71'
            },
            'stopped': {
                title: '🔴 SERWER ZATRZYMANY',
                details: 'Serwer jest wyłączony',
                color: '#e74c3c'
            },
            'starting': {
                title: '🟡 URUCHAMIANIE...',
                details: 'Serwer się uruchamia',
                color: '#f39c12'
            },
            'stopping': {
                title: '🟡 ZATRZYMOWANIE...',
                details: 'Serwer się zatrzymuje',
                color: '#f39c12'
            },
            'disconnected': {
                title: '⚪ BRAK POŁĄCZENIA',
                details: 'Nie można połączyć z backendem',
                color: '#95a5a6'
            }
        };
        
        const config = statusConfig[status] || {
            title: '⚫ STATUS NIEZNANY',
            details: 'Nie można określić statusu',
            color: '#95a5a6'
        };
        
        this.elements.statusTitle.textContent = config.title;
        this.elements.statusDetails.textContent = config.details;
        this.elements.statusTitle.style.color = config.color;
        
        // Aktualizuj liczbę graczy
        if (status === 'running' && data.players && data.players.length > 0) {
            this.elements.playerCount.innerHTML = `👥 ${data.players.length} graczy online`;
        } else {
            this.elements.playerCount.innerHTML = `👥 0 graczy`;
        }
        
        // Wyświetl logi jeśli są
        if (data.logs && data.logs.length > 0) {
            this.displayLogs(data.logs);
        }
    }
    
    displayLogs(logs) {
        // Usuń loading spinner jeśli istnieje
        const loading = this.elements.consoleOutput.querySelector('.loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Sprawdź czy już mamy te logi
        const currentContent = this.elements.consoleOutput.innerHTML;
        const newLogsHtml = logs.map(log => {
            const type = this.determineLogType(log);
            return `<div class="log-line log-${type}">${this.escapeHtml(log)}</div>`;
        }).join('');
        
        // Dodaj tylko jeśli się zmieniło
        if (currentContent !== newLogsHtml) {
            this.elements.consoleOutput.innerHTML = newLogsHtml;
            
            // Auto-scroll do dołu
            setTimeout(() => {
                this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
            }, 100);
        }
    }
    
    determineLogType(log) {
        const lowerLog = log.toLowerCase();
        if (lowerLog.includes('error') || lowerLog.includes('błąd') || lowerLog.includes('failed')) {
            return 'error';
        } else if (lowerLog.includes('warning') || lowerLog.includes('ostrzeżenie')) {
            return 'warning';
        } else if (lowerLog.includes('[info]') || lowerLog.includes('[cmd]')) {
            return 'info';
        } else if (lowerLog.includes('[system]') || lowerLog.includes('connected') || lowerLog.includes('połączono')) {
            return 'system';
        }
        return 'info';
    }
    
    logToConsole(message, type = 'info') {
        // Usuń loading spinner jeśli istnieje
        const loading = this.elements.consoleOutput.querySelector('.loading');
        if (loading) {
            loading.style.display = 'none';
        }
        
        const timestamp = new Date().toLocaleTimeString('pl-PL');
        const logEntry = `[${timestamp}] ${message}`;
        
        const line = document.createElement('div');
        line.className = `log-line log-${type}`;
        line.textContent = logEntry;
        
        this.elements.consoleOutput.appendChild(line);
        
        // Auto-scroll
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
        
        // Ogranicz do 200 linii
        const lines = this.elements.consoleOutput.children;
        if (lines.length > 200) {
            for (let i = 0; i < lines.length - 200; i++) {
                this.elements.consoleOutput.removeChild(lines[i]);
            }
        }
    }
    
    clearConsole() {
        this.elements.consoleOutput.innerHTML = '';
        this.logToConsole('Konsola wyczyszczona', 'system');
    }
    
    updateConnectionStatus(text, color) {
        this.elements.connectionStatus.textContent = text;
        this.elements.connectionStatus.style.color = color;
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        
        this.refreshInterval = setInterval(() => {
            if (this.autoRefresh && this.isConnected) {
                this.checkStatus();
            }
        }, 5000); // Co 5 sekund
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Start controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mcController = new MinecraftController();
    
    // Pokazuj informację o naciśnięciu klawisza
    console.log('🎮 Minecraft Controller loaded!');
    console.log('Backend URL:', window.mcController.apiUrl);
});
