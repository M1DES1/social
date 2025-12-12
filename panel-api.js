const express = require('express');
const app = express();
app.use(express.json());

// Render dostarcza port przez zmienną środowiskową
const PORT = process.env.PORT || 3000;

// Zezwól tylko Twojej stronie GitHub Pages
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://m1des1.github.io');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Proste endpointy testowe
app.post('/start', (req, res) => {
    console.log('Otrzymano żądanie START');
    // Tutaj później dodasz logikę SSH do Codespace
    res.json({ success: true, message: 'Komenda START odebrana (test Render)' });
});

app.post('/stop', (req, res) => {
    console.log('Otrzymano żądanie STOP');
    res.json({ success: true, message: 'Komenda STOP odebrana (test Render)' });
});

app.get('/status', (req, res) => {
    res.json({ 
        status: 'offline', 
        players: 0, 
        version: "Paper 1.20.4", 
        port: 5718,
        note: 'API hostowane na Render.com'
    });
});

app.listen(PORT, () => {
    console.log(`✅ Panel API Render działa na porcie ${PORT}`);
});
