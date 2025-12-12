// KONFIGURACJA
// ZASTĄP TEN ADRES URL ADRESEM TWOJEGO BACKENDU NA RENDER.COM!
const BACKEND_URL = 'https://social-aj2h.onrender.com';
let autoRefreshInterval = null;
let connectionOk = false;

// Elementy DOM
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const restartBtn = document.getElementById('restartBtn');
const clearBtn = document.getElementById('clearBtn');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshCheckbox = document.getElementById('autoRefresh');
const commandInput = document.getElementById('commandInput');
const sendCommandBtn = document.getElementById('sendCommandBtn');
const serverStatusElement = document.getElementById('serverStatus');
const consoleLogElement = document.getElementById('consoleLog');
const lastCheckElement = document.getElementById('lastCheck');
const backendUrlElement = document.getElementById('backendUrl');
const connectionStatusElement = document.getElementById('connectionStatus');

// Inicjalizacja
document.addEventListener('DOMContentLoaded', function() {
    backendUrlElement.textContent = BACKEND_URL;
    updateConnectionStatus();
    checkServerStatus();
    setupEventListeners();
    startAutoRefresh();
});

// Ustawienie nasłuchiwaczy zdarzeń
function setupEventListeners() {
    startBtn.addEventListener('click', () => sendCommand('start'));
    stopBtn.addEventListener('click', () => sendCommand('stop'));
    restartBtn.addEventListener('click', () => sendCommand('restart'));
    clearBtn.addEventListener('click', clearConsole);
    refreshBtn.addEventListener('click', checkServerStatus);
    sendCommandBtn.addEventListener('click', sendCustomCommand);
    commandInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendCustomCommand();
    });
    
    autoRefreshCheckbox.addEventListener('change', function() {
        if (this.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
}

// Sprawdzenie statusu serwera
async function checkServerStatus() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/status`);
        if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
        
        const data = await response.json();
        updateUI(data);
        connectionOk = true;
        updateConnectionStatus();
        
        // Aktualizacja czasu ostatniego sprawdzenia
        const now = new Date();
        lastCheckElement.textContent = now.toLocaleTimeString('pl-PL');
        
    } catch (error) {
        console.error('Błąd podczas sprawdzania statusu:', error);
        connectionOk = false;
        updateConnectionStatus();
        
        // Aktualizacja UI z błędem
        serverStatusElement.innerHTML = `
            <span class="status-icon"><i class="fas fa-exclamation-triangle"></i></span>
            <span class="status-text">Błąd połączenia z backendem</span>
        `;
        serverStatusElement.className = 'status unknown';
        
        addToConsole(`[Błąd] Nie można połączyć się z backendem: ${error.message}`);
    }
}

// Wysłanie komendy do serwera
async function sendCommand(command) {
    if (!connectionOk) {
        alert('Brak połączenia z backendem. Sprawdź konfigurację.');
        return;
    }
    
    // Wizualne potwierdzenie kliknięcia
    const button = document.querySelector(`#${command}Btn`);
    const originalText = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Wysyłanie...`;
    button.disabled = true;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command })
        });
        
        if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
        
        const data = await response.json();
        addToConsole(`[Panel] ${data.message}`);
        
        // Odczekaj chwilę i sprawdź nowy status
        setTimeout(() => {
            checkServerStatus();
        }, 2000);
        
    } catch (error) {
        console.error('Błąd podczas wysyłania komendy:', error);
        addToConsole(`[Błąd] Nie udało się wysłać komendy: ${error.message}`);
        alert(`Błąd: ${error.message}`);
    } finally {
        // Przywróć przycisk do oryginalnego stanu
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 1000);
    }
}

// Wysłanie własnej komendy do konsoli Minecraft
async function sendCustomCommand() {
    const command = commandInput.value.trim();
    if (!command) return;
    
    addToConsole(`[Użytkownik] > ${command}`);
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command })
        });
        
        if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
        
        // Wyczyść pole wejściowe
        commandInput.value = '';
        
        // Odśwież logi po chwili
        setTimeout(() => {
            fetchLogs();
        }, 1000);
        
    } catch (error) {
        console.error('Błąd podczas wysyłania komendy:', error);
        addToConsole(`[Błąd] Nie udało się wysłać komendy: ${error.message}`);
    }
}

// Pobranie logów z serwera
async function fetchLogs() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/logs?lines=30`);
        if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
        
        const data = await response.json();
        displayLogs(data.logs);
        
    } catch (error) {
        console.error('Błąd podczas pobierania logów:', error);
        addToConsole(`[Błąd] Nie można pobrać logów: ${error.message}`);
    }
}

// Aktualizacja interfejsu użytkownika
function updateUI(data) {
    // Aktualizacja statusu serwera
    const status = data.status || 'unknown';
    serverStatusElement.className = `status ${status}`;
    
    let statusIcon, statusText;
    switch(status) {
        case 'działa':
            statusIcon = '<i class="fas fa-play-circle"></i>';
            statusText = 'Serwer działa';
            break;
        case 'zatrzymany':
            statusIcon = '<i class="fas fa-stop-circle"></i>';
            statusText = 'Serwer zatrzymany';
            break;
        case 'zatrzymywanie':
            statusIcon = '<i class="fas fa-hourglass-half"></i>';
            statusText = 'Serwer się zatrzymuje...';
            break;
        default:
            statusIcon = '<i class="fas fa-question-circle"></i>';
            statusText = 'Status nieznany';
    }
    
    serverStatusElement.innerHTML = `
        <span class="status-icon">${statusIcon}</span>
        <span class="status-text">${statusText}</span>
    `;
    
    // Wyświetlenie logów
    if (data.logs && data.logs.length > 0) {
        displayLogs(data.logs);
    }
}

// Wyświetlanie logów w konsoli
function displayLogs(logs) {
    consoleLogElement.textContent = logs.join('\n');
    
    // Automatyczne przewijanie do dołu
    const consoleOutput = document.querySelector('.console-output');
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Dodanie wiadomości do konsoli
function addToConsole(message) {
    const timestamp = new Date().toLocaleTimeString('pl-PL');
    const logEntry = `[${timestamp}] ${message}`;
    
    // Dodanie na początek (najnowsze na górze)
    const currentLogs = consoleLogElement.textContent.split('\n');
    currentLogs.unshift(logEntry);
    
    // Ograniczenie do 50 linii
    if (currentLogs.length > 50) {
        currentLogs.length = 50;
    }
    
    consoleLogElement.textContent = currentLogs.join('\n');
}

// Czyszczenie konsoli
function clearConsole() {
    consoleLogElement.textContent = '[Konsola wyczyszczona]';
    addToConsole('Konsola została wyczyszczona przez użytkownika');
}

// Automatyczne odświeżanie
function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(() => {
        if (connectionOk && autoRefreshCheckbox.checked) {
            checkServerStatus();
        }
    }, 5000); // Odświeżaj co 5 sekund
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Aktualizacja statusu połączenia
function updateConnectionStatus() {
    if (connectionOk) {
        connectionStatusElement.textContent = 'Połączono';
        connectionStatusElement.style.color = '#2ecc71';
    } else {
        connectionStatusElement.textContent = 'Brak połączenia';
        connectionStatusElement.style.color = '#e74c3c';
    }
}
