const express = require('express');
const { exec } = require('child_process');
const app = express();
app.use(express.json());

// Render.com dostarcza port przez zmienną środowiskową
const PORT = process.env.PORT || 3000;

// --- KONFIGURACJA (ZMIENNE ŚRODOWISKOWE) ---
// Te wartości ustawisz później w dashboardzie Render.com
const SSH_HOST = process.env.SSH_HOST; // np. 'my-codespace-abc123.github.com'
const SSH_USER = process.env.SSH_USER; // 'codespace'
const SSH_PRIVATE_KEY = process.env.SSH_PRIVATE_KEY; // Prywatny klucz SSH
const MINECRAFT_START_CMD = process.env.MC_START_CMD || 'cd /workspaces/codespaces-blank && java -Xmx2G -jar server.jar nogui';
const MINECRAFT_STOP_CMD = process.env.MC_STOP_CMD || 'cd /workspaces/codespaces-blank && mcrcon -H 127.0.0.1 -P 25575 -p password stop';

// --- KONFIGURACJA CORS ---
// Zezwól tylko Twojej stronie GitHub Pages
const allowedOrigins = ['https://m1des1.github.io'];
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// --- ENDPOINTY API ---
app.post('/start', (req, res) => {
    console.log('Otrzymano żądanie START');
    const sshCommand = `ssh -o StrictHostKeyChecking=no -i /tmp/ssh_key ${SSH_USER}@${SSH_HOST} "${MINECRAFT_START_CMD}"`;
    exec(sshCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Błąd SSH (start):', error);
            return res.json({ success: false, message: `Błąd: ${error.message}` });
        }
        console.log('Serwer Minecraft uruchomiony.');
        res.json({ success: true, message: 'Serwer uruchamiany...' });
    });
});

app.post('/stop', (req, res) => {
    console.log('Otrzymano żądanie STOP');
    const sshCommand = `ssh -o StrictHostKeyChecking=no -i /tmp/ssh_key ${SSH_USER}@${SSH_HOST} "${MINECRAFT_STOP_CMD}"`;
    exec(sshCommand, (error, stdout, stderr) => {
        if (error) {
            console.error('Błąd SSH (stop):', error);
            return res.json({ success: false, message: `Błąd: ${error.message}` });
        }
        console.log('Komenda STOP wysłana.');
        res.json({ success: true, message: 'Zatrzymywanie serwera...' });
    });
});

app.get('/status', async (req, res) => {
    // Prosta implementacja - zawsze zwraca offline. Możesz ją rozbudować.
    res.json({
        status: 'offline',
        players: 0,
        version: "Paper 1.20.4",
        port: 5718
    });
});

// --- URUCHOMIENIE SERWERA ---
app.listen(PORT, () => {
    console.log(`✅ Panel API działa na porcie ${PORT}`);
    // Zapisz klucz SSH do tymczasowego pliku (Render nie pozwala na bezpośrednie użycie zmiennej w komendzie)
    if (SSH_PRIVATE_KEY) {
        const fs = require('fs');
        fs.writeFileSync('/tmp/ssh_key', SSH_PRIVATE_KEY);
        fs.chmodSync('/tmp/ssh_key', 0o600); // Tylko właściciel może czytać/zapisywać
    }
});
