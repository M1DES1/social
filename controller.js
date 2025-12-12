class MinecraftController {
    constructor() {
        // 🔧 TU WPISZ SWÓJ ADRES WEB SOCKET Z CODESPACES
        // Znajdziesz go w zakładce "Ports" w Codespace - publiczny URL dla portu 8765
        this.wsUrl = "wss://YOUR-CODESPACE-URL.app.github.dev";  // ← ZMIEŃ TO!
        this.ws = null;
        this.reconnectInterval = null;
        this.autoReconnect = true;
        
        this.elements = {
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            statusDetails: document.getElementById('statusDetails'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            restartBtn: document.getElementById('restartBtn'),
            consoleOutput: document.getElementById('consoleOutput'),
            commandInput: document.getElementById('commandInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            connectBtn: document.getElementById('connectBtn'),
            connectionStatus: document.getElementById('connectionStatus'),
            wsUrl: document.getElementById('wsUrl')
        };
        
        this.init();
    }
    
    init() {
        this.elements.wsUrl.textContent = this.wsUrl;
        this.setupEventListeners();
        this.connect();
        
        // Auto-reconnect co 5 sekund jeśli rozłączony
        this.reconnectInterval = setInterval(() => {
            if (this.autoReconnect && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
                this.connect();
            }
        }, 5000);
    }
    
    connect() {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            return;
        }
        
        this.updateConnectionStatus('Łączenie...', '#f39c12');
        this.logToConsole('Łączenie z serwerem WebSocket...', 'system');
        
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => {
                this.updateConnectionStatus('Połączono', '#2ecc71');
                this.logToConsole('Połączenie z serwerem ustanowione!', 'system');
                this.updateStatus({ status: 'connecting' });
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'status') {
                        this.updateStatus(data.data);
                    } else if (data.type === 'log') {
                        this.logToConsole(data.message, 'info');
                    }
                } catch (e) {
                    console.error('Błąd parsowania wiadomości:', e);
                }
            };
            
            this.ws.onclose = () => {
                this.updateConnectionStatus('Rozłączono', '#e74c3c');
                this.logToConsole('Połączenie z serwerem zostało zamknięte', 'system');
                this.updateStatus({ status: 'disconnected' });
                
                if (this.autoReconnect) {
                    setTimeout(() => this.connect(), 3000);
                }
            };
            
            this.ws.onerror = (error) => {
                this.updateConnectionStatus('Błąd połączenia', '#e74c3c');
                this.logToConsole(`Błąd połączenia: ${error.message || 'Nieznany błąd'}`, 'error');
            };
            
        } catch (error) {
            this.logToConsole(`Nie można utworzyć połączenia: ${error.message}`, 'error');
        }
    }
    
    sendCommand(command) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.logToConsole('Brak połączenia z serwerem!', 'error');
            return false;
        }
        
        const message = {
            type: 'command',
            command: command
        };
        
        this.ws.send(JSON.stringify(message));
        this.logToConsole(`Wysłano komendę: ${command}`, 'system');
        return true;
    }
    
    updateStatus(data) {
        const status = data.status || 'unknown';
        
        // Aktualizacja wskaźnika statusu
        this.elements.statusIndicator.className = 'status-indicator ' + status;
        
        // Aktualizacja tekstu statusu
        const statusMessages = {
            'running': '🟢 Serwer działa',
            'stopped': '🔴 Serwer zatrzymany',
            'starting': '🟡 Serwer uruchamia się...',
            'stopping': '🟡 Serwer zatrzymuje się...',
            'disconnected': '⚫ Brak połączenia'
        };
        
        this.elements.statusText.textContent = statusMessages[status] || 'Status nieznany';
        
        // Aktualizacja szczegółów
        if (status === 'running') {
            this.elements.statusDetails.textContent = 'Serwer Minecraft jest aktywny';
        } else if (status === 'stopped') {
            this.elements.statusDetails.textContent = 'Serwer jest wyłączony';
        }
        
        // Wyświetl logi jeśli są
        if (data.logs && data.logs.length > 0) {
            data.logs.forEach(log => {
                if (!this.elements.consoleOutput.textContent.includes(log)) {
                    this.logToConsole(log, 'info');
                }
            });
        }
    }
    
    logToConsole(message, type = 'info') {
        const line = document.createElement('div');
        line.className = `log-line log-${type}`;
        line.textContent = message;
        
        this.elements.consoleOutput.appendChild(line);
        
        // Auto-scroll do dołu
        this.elements.consoleOutput.scrollTop = this.elements.consoleOutput.scrollHeight;
        
        // Ogranicz do 200 linii
        const lines = this.elements.consoleOutput.children;
        if (lines.length > 200) {
            for (let i = 0; i < lines.length - 200; i++) {
                this.elements.consoleOutput.removeChild(lines[i]);
            }
        }
    }
    
    updateConnectionStatus(text, color) {
        this.elements.connectionStatus.textContent = text;
        this.elements.connectionStatus.style.color = color;
    }
    
    setupEventListeners() {
        // Przyciski kontroli
        this.elements.startBtn.addEventListener('click', () => {
            if (this.sendCommand('start')) {
                this.elements.startBtn.disabled = true;
                setTimeout(() => this.elements.startBtn.disabled = false, 3000);
            }
        });
        
        this.elements.stopBtn.addEventListener('click', () => {
            if (this.sendCommand('stop')) {
                this.elements.stopBtn.disabled = true;
                setTimeout(() => this.elements.stopBtn.disabled = false, 3000);
            }
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            if (this.sendCommand('restart')) {
                this.elements.restartBtn.disabled = true;
                setTimeout(() => this.elements.restartBtn.disabled = false, 5000);
            }
        });
        
        // Wysyłanie komend z konsoli
        this.elements.sendBtn.addEventListener('click', () => {
            const cmd = this.elements.commandInput.value.trim();
            if (cmd) {
                this.sendCommand(cmd);
                this.elements.commandInput.value = '';
            }
        });
        
        this.elements.commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.elements.sendBtn.click();
            }
        });
        
        // Czyszczenie konsoli
        this.elements.clearBtn.addEventListener('click', () => {
            this.elements.consoleOutput.innerHTML = '';
            this.logToConsole('Konsola wyczyszczona', 'system');
        });
        
        // Ręczne łączenie
        this.elements.connectBtn.addEventListener('click', () => {
            this.connect();
        });
    }
}

// Start controller when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mcController = new MinecraftController();
});
