const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Zmienne stanu serwera
let minecraftProcess = null;
let serverStatus = 'zatrzymany';
let consoleLogs = ['=== System Minecraft Server został zainicjowany ==='];

// Ścieżka do pliku serwera Minecraft (możesz zmienić)
const SERVER_JAR_PATH = './server.jar';
const SERVER_DIR = path.join(__dirname, 'minecraft_server');

// Upewnij się, że folder serwera istnieje
if (!fs.existsSync(SERVER_DIR)) {
    fs.mkdirSync(SERVER_DIR, { recursive: true });
}

// Funkcja do logowania wiadomości
function logToConsole(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    consoleLogs.push(logEntry);
    console.log(logEntry);
    
    // Ogranicz ilość logów w pamięci (ostatnie 100 linii)
    if (consoleLogs.length > 100) {
        consoleLogs = consoleLogs.slice(-100);
    }
}

// Funkcja startująca serwer Minecraft
function startMinecraftServer() {
    if (minecraftProcess) {
        logToConsole('Serwer już działa!');
        return false;
    }
    
    logToConsole('Uruchamianie serwera Minecraft...');
    
    // Zmiana katalogu roboczego na folder serwera
    const cwd = SERVER_DIR;
    
    // Komenda do uruchomienia serwera
    // UWAGA: Potrzebujesz pliku server.jar w folderze minecraft_server/
    const command = 'java';
    const args = ['-Xmx1024M', '-Xms1024M', '-jar', 'server.jar', 'nogui'];
    
    minecraftProcess = spawn(command, args, { cwd });
    
    minecraftProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logToConsole(`[Serwer] ${output}`);
    });
    
    minecraftProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();
        logToConsole(`[Błąd] ${error}`);
    });
    
    minecraftProcess.on('close', (code) => {
        logToConsole(`Serwer został zatrzymany z kodem: ${code}`);
        minecraftProcess = null;
        serverStatus = 'zatrzymany';
    });
    
    serverStatus = 'działa';
    logToConsole('Serwer Minecraft został uruchomiony!');
    return true;
}

// Funkcja zatrzymująca serwer
function stopMinecraftServer() {
    if (!minecraftProcess) {
        logToConsole('Serwer nie jest uruchomiony!');
        return false;
    }
    
    logToConsole('Zatrzymywanie serwera Minecraft...');
    minecraftProcess.stdin.write('stop\n');
    serverStatus = 'zatrzymywanie';
    return true;
}

// Endpointy API

// Sprawdzenie statusu serwera
app.get('/api/status', (req, res) => {
    res.json({
        status: serverStatus,
        logs: consoleLogs.slice(-20) // Ostatnie 20 logów
    });
});

// Wysłanie komendy do serwera
app.post('/api/command', (req, res) => {
    const { command } = req.body;
    
    if (!command) {
        return res.status(400).json({ error: 'Brak komendy' });
    }
    
    let success = false;
    let message = '';
    
    switch(command.toLowerCase()) {
        case 'start':
            success = startMinecraftServer();
            message = success ? 'Rozpoczynanie uruchamiania serwera...' : 'Serwer już działa!';
            break;
            
        case 'stop':
            success = stopMinecraftServer();
            message = success ? 'Zatrzymywanie serwera...' : 'Serwer nie jest uruchomiony!';
            break;
            
        case 'restart':
            if (minecraftProcess) {
                stopMinecraftServer();
                // Opóźnienie przed restartem
                setTimeout(() => {
                    startMinecraftServer();
                }, 5000);
                message = 'Restartowanie serwera...';
                success = true;
            } else {
                message = 'Nie można zrestartować - serwer nie działa!';
            }
            break;
            
        default:
            // Wysłanie komendy do konsoli Minecraft
            if (minecraftProcess) {
                minecraftProcess.stdin.write(command + '\n');
                message = `Wysłano komendę: ${command}`;
                success = true;
            } else {
                message = 'Serwer nie jest uruchomiony!';
            }
    }
    
    res.json({ 
        success, 
        message, 
        status: serverStatus 
    });
    
    logToConsole(`[Web] ${message}`);
});

// Pobranie logów konsoli
app.get('/api/logs', (req, res) => {
    const { lines = 50 } = req.query;
    const numLines = parseInt(lines);
    const logs = consoleLogs.slice(-numLines);
    
    res.json({ logs });
});

// Strona główna - informacja o API
app.get('/', (req, res) => {
    res.send(`
        <h1>Minecraft Server Controller</h1>
        <p>Backend do kontroli serwera Minecraft</p>
        <p>Status API: <strong>Działa</strong></p>
        <p>Endpointy:</p>
        <ul>
            <li>GET /api/status - status serwera i logi</li>
            <li>POST /api/command - wysłanie komendy (start/stop/restart)</li>
            <li>GET /api/logs - pobranie logów konsoli</li>
        </ul>
    `);
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Backend serwera Minecraft działa na porcie ${PORT}`);
    logToConsole('Aplikacja backend została uruchomiona');
});
