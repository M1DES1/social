class MinecraftController {
    constructor() {
        // 🔧 TU WPISZ SWÓJ ADRES HTTP Z CODESPACES
        // Przykład: https://xxxx-8080.app.github.dev
        this.apiUrl = "https://xxxx-8080.app.github.dev";  // ← ZMIEŃ TO!
        
        this.autoRefresh = true;
        this.refreshInterval = null;
        
        this.elements = {
            statusPanel: document.getElementById('statusPanel'),
            statusText: document.getElementById('statusText'),
            statusDetails: document.getElementById('statusDetails'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            restartBtn: document.getElementById('restartBtn'),
            consoleOutput: document.getElementById('consoleOutput'),
            commandInput: document.getElementById('commandInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            connectionStatus: document.getElementById('connectionStatus'),
            backendUrl: document.getElementById('backendUrl')
        };
        
        this.init();
    }
    
    init() {
        this.elements.backendUrl.textContent = this.apiUrl;
        this.setupEventListeners();
        this.checkConnection();
        this.startAutoRefresh();
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
    }
    
    async checkConnection() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Accept': 'text/html' }
            });
            
            if (response.ok) {
                this.updateConnectionStatus('Połączono', '#2ecc71');
                this.logToConsole('Połączono z serwerem kontrolera', 'info');
                this.checkStatus();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.updateConnectionStatus('Brak połączenia', '#e74c3c');
            this.logToConsole(`Błąd połączenia: ${error.message}`, 'error');
        }
    }
    
    async checkStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/api/status`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.updateStatus(data);
            this.updateConnectionStatus('Połączono', '#2ecc71');
            
        } catch (error) {
            this.updateConnectionStatus('Błąd', '#e74c3c');
            this.logToConsole(`Błąd pobierania statusu: ${error.message}`, 'error');
        }
    }
    
    async sendCommand(command) {
        if (!this.apiUrl) {
            this.logToConsole('Brak adresu API!', 'error');
            return;
        }
        
        // Wizualne potwierdzenie
        const button = this.elements[`${command}Btn`];
        const originalText = button.innerHTML;
        button.innerHTML = '⏳ Wysyłanie...';
        button.disabled = true;
        
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
            this.logToConsole(`[Panel] ${data.message}`, 'info');
            
            // Odśwież status po 2 sekundach
            setTimeout(() => this.checkStatus(), 2000);
            
        } catch (error) {
            this.logToConsole(`Błąd wysyłania komendy: ${error.message}`, 'error');
        } finally {
            // Przywróć przycisk
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 1000);
        }
    }
    
    async sendCustomCommand() {
        const command = this.elements.commandInput.value.trim();
        if (!command) return;
        
        this.logToConsole(`[Użytkownik] > ${command}`, 'info');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/command`, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.logToConsole(`[Odpowiedź] ${data.message}`, 'info');
            
            // Wyczyść pole i odśwież logi
            this.elements.commandInput.value = '';
            setTimeout(() => this.checkStatus(), 1000);
            
        } catch (error) {
            this.logToConsole(`Błąd wysyłania: ${error.message}`, 'error');
        }
    }
    
    async fetchLogs() {
        try {
            const response = await fetch(`${this.apiUrl}/api/logs?count=30`, {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.displayLogs(data.logs);
            
        } catch (error) {
            this.logToConsole(`Błąd pobierania logów: ${error.message}`, 'error');
        }
    }
    
    updateStatus(data) {
        const status = data.status || 'unknown';
        
        // Aktualizacja panelu statusu
        this.elements.statusPanel.className = `status ${status}`;
        
        const statusMessages = {
            'running': '🟢 Serwer działa',
            'stopped': '🔴 Serwer zatrzymany',
            'starting': '🟡 Serwer uruchamia się...',
            'stopping': '🟡 Serwer zatrzymuje się...'
        };
        
        this.elements.statusText.textContent = `Status: ${statusMessages[status] || 'Nieznany'}`;
        
        // Szczegóły
        if (status === 'running') {
            this.elements.statusDetails.textContent = `Gracze: ${data.players?.length || 0}`;
        } else {
            this.elements.statusDetails.textContent = 'Serwer gotowy do uruchomienia';
        }
        
        // Wyświetl logi
        if (data.logs && data.logs.length > 0) {
            this.displayLogs(data.logs);
        }
    }
    
    displayLogs(logs) {
        // Zachowaj istniejące logi, dodaj tylko nowe
        const currentLogs = this.elements.consoleOutput.innerHTML;
        const newLogs = logs.map(log => {
            const type = log.includes('Błąd') || log.includes('ERROR') ? 'error' : 'info';
            return `<div class="log-line log-${type}">${this.escapeHtml(log)}</div>`;
        }).join('');
        
        this.elements.consoleOutput.innerHTML = newLogs;
        
        // Auto-scroll
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
    }
    
    logToConsole(message, type = 'info') {
        const line = document.createElement('div');
        line.className = `log-line log-${type}`;
        line.textContent = message;
        
        this.elements.consoleOutput.appendChild(line);
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
        
        // Ogranicz do 100 linii
        const lines = this.elements.consoleOutput.children;
        if (lines.length > 100) {
            this.elements.consoleOutput.removeChild(lines[0]);
        }
    }
    
    clearConsole() {
        this.elements.consoleOutput.innerHTML = '';
        this.logToConsole('Konsola wyczyszczona', 'info');
    }
    
    updateConnectionStatus(text, color) {
        this.elements.connectionStatus.textContent = text;
        this.elements.connectionStatus.style.color = color;
    }
    
    startAutoRefresh() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        
        this.refreshInterval = setInterval(() => {
            if (this.autoRefresh) {
                this.checkStatus();
            }
        }, 5000); // Odświeżaj co 5 sekund
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
});
