const WebSocket = require('ws');
const http = require('http');

// Configuration
const CONFIG = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    PLAYER_START_SIZE: 20,
    FOOD_SIZE: 5,
    FOOD_COUNT: 200,
    SPEED_MULTIPLIER: 2.5,
    TICK_RATE: 60, // Server updates per second
};

// Game state
const players = new Map();
const food = [];

// Initialize food
function initFood() {
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        food.push(createFood());
    }
}

function createFood() {
    return {
        id: Math.random().toString(36).substr(2, 9),
        x: Math.random() * CONFIG.WORLD_WIDTH,
        y: Math.random() * CONFIG.WORLD_HEIGHT,
        color: getRandomColor()
    };
}

function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createPlayer(id, name, color) {
    return {
        id,
        name: name || 'Quagmire',
        color: color || getRandomColor(),
        x: Math.random() * CONFIG.WORLD_WIDTH,
        y: Math.random() * CONFIG.WORLD_HEIGHT,
        size: CONFIG.PLAYER_START_SIZE,
        score: 0,
        targetX: 0,
        targetY: 0,
        ws: null
    };
}

function updatePlayer(player, deltaTime) {
    // Move towards target
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
        const speed = CONFIG.SPEED_MULTIPLIER * (100 / player.size) * deltaTime;
        const moveDistance = Math.min(speed, distance);
        
        player.x += (dx / distance) * moveDistance;
        player.y += (dy / distance) * moveDistance;
    }
    
    // Keep player in bounds
    player.x = Math.max(player.size, Math.min(CONFIG.WORLD_WIDTH - player.size, player.x));
    player.y = Math.max(player.size, Math.min(CONFIG.WORLD_HEIGHT - player.size, player.y));
}

function checkCollisions() {
    // Check food collisions
    for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        
        for (const [id, player] of players) {
            const dx = player.x - f.x;
            const dy = player.y - f.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.size) {
                // Player ate food
                player.size += 0.5;
                player.score += 1;
                food.splice(i, 1);
                food.push(createFood());
                break;
            }
        }
    }
    
    // Check player collisions
    const playerArray = Array.from(players.values());
    for (let i = 0; i < playerArray.length; i++) {
        for (let j = i + 1; j < playerArray.length; j++) {
            const p1 = playerArray[i];
            const p2 = playerArray[j];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if players are touching
            if (distance < p1.size + p2.size) {
                // Bigger player eats smaller player (with 10% size advantage needed)
                if (p1.size > p2.size * 1.1) {
                    p1.size += p2.size * 0.5;
                    p1.score += Math.floor(p2.score * 0.5);
                    
                    // Respawn eaten player
                    p2.x = Math.random() * CONFIG.WORLD_WIDTH;
                    p2.y = Math.random() * CONFIG.WORLD_HEIGHT;
                    p2.size = CONFIG.PLAYER_START_SIZE;
                    p2.score = 0;
                    
                    // Notify player they were eaten
                    if (p2.ws && p2.ws.readyState === WebSocket.OPEN) {
                        p2.ws.send(JSON.stringify({
                            type: 'death',
                            killedBy: p1.name
                        }));
                    }
                } else if (p2.size > p1.size * 1.1) {
                    p2.size += p1.size * 0.5;
                    p2.score += Math.floor(p1.score * 0.5);
                    
                    // Respawn eaten player
                    p1.x = Math.random() * CONFIG.WORLD_WIDTH;
                    p1.y = Math.random() * CONFIG.WORLD_HEIGHT;
                    p1.size = CONFIG.PLAYER_START_SIZE;
                    p1.score = 0;
                    
                    // Notify player they were eaten
                    if (p1.ws && p1.ws.readyState === WebSocket.OPEN) {
                        p1.ws.send(JSON.stringify({
                            type: 'death',
                            killedBy: p2.name
                        }));
                    }
                }
            }
        }
    }
}

function getGameState() {
    const playersData = Array.from(players.values()).map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        x: p.x,
        y: p.y,
        size: p.size,
        score: p.score
    }));
    
    return {
        type: 'gameState',
        players: playersData,
        food: food
    };
}

function broadcastGameState() {
    const state = getGameState();
    const message = JSON.stringify(state);
    
    for (const [id, player] of players) {
        if (player.ws && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(message);
        }
    }
}

// Create HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS for all origins
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Giggity.io Server</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 30px;
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                }
                h1 { margin-top: 0; }
                .status { 
                    background: rgba(76, 175, 80, 0.3);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .info {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 15px;
                    border-radius: 8px;
                    margin: 10px 0;
                }
                code {
                    background: rgba(0, 0, 0, 0.3);
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: monospace;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                .stat-box {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 32px;
                    font-weight: bold;
                }
                .stat-label {
                    font-size: 14px;
                    opacity: 0.8;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 Giggity.io WebSocket Server</h1>
                
                <div class="status">
                    <strong>✅ Server Status:</strong> Running
                </div>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-value" id="playerCount">${players.size}</div>
                        <div class="stat-label">Active Players</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${food.length}</div>
                        <div class="stat-label">Food Items</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${CONFIG.TICK_RATE}</div>
                        <div class="stat-label">Tick Rate (Hz)</div>
                    </div>
                </div>
                
                <div class="info">
                    <h3>📡 WebSocket Connection</h3>
                    <p>Connect to: <code>wss://${req.headers.host}</code></p>
                    <p style="font-size: 12px; opacity: 0.8;">Use this URL in your game client to connect to the server.</p>
                </div>
                
                <div class="info">
                    <h3>🎯 Game Configuration</h3>
                    <ul>
                        <li>World Size: ${CONFIG.WORLD_WIDTH} x ${CONFIG.WORLD_HEIGHT}</li>
                        <li>Starting Size: ${CONFIG.PLAYER_START_SIZE}</li>
                        <li>Food Count: ${CONFIG.FOOD_COUNT}</li>
                        <li>Speed Multiplier: ${CONFIG.SPEED_MULTIPLIER}x</li>
                    </ul>
                </div>
                
                <div class="info">
                    <h3>📝 Setup Instructions</h3>
                    <ol>
                        <li>Copy the WebSocket URL above</li>
                        <li>Open your <code>index.html</code> file</li>
                        <li>Find the line: <code>const WEBSOCKET_URL = 'YOUR_RENDER_WEBSOCKET_URL_HERE';</code></li>
                        <li>Replace <code>YOUR_RENDER_WEBSOCKET_URL_HERE</code> with your WebSocket URL</li>
                        <li>Save and deploy to GitHub Pages</li>
                    </ol>
                </div>
            </div>
            
            <script>
                setInterval(() => {
                    fetch(window.location.href)
                        .then(r => r.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const newCount = doc.getElementById('playerCount').textContent;
                            document.getElementById('playerCount').textContent = newCount;
                        });
                }, 2000);
            </script>
        </body>
        </html>
    `);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`New client connected from ${clientIp}`);
    let playerId = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'join':
                    // Create new player
                    playerId = Math.random().toString(36).substr(2, 9);
                    const player = createPlayer(playerId, data.name, data.color);
                    player.ws = ws;
                    players.set(playerId, player);
                    
                    // Send init message
                    ws.send(JSON.stringify({
                        type: 'init',
                        id: playerId,
                        x: player.x,
                        y: player.y
                    }));
                    
                    console.log(`Player ${player.name} (${playerId}) joined. Total players: ${players.size}`);
                    break;
                    
                case 'move':
                    // Update player target position
                    if (playerId && players.has(playerId)) {
                        const player = players.get(playerId);
                        player.targetX = data.targetX;
                        player.targetY = data.targetY;
                    }
                    break;

                case 'respawn':
                    // Respawn player
                    if (playerId && players.has(playerId)) {
                        const player = players.get(playerId);
                        player.x = Math.random() * CONFIG.WORLD_WIDTH;
                        player.y = Math.random() * CONFIG.WORLD_HEIGHT;
                        player.size = CONFIG.PLAYER_START_SIZE;
                        player.score = 0;
                        console.log(`Player ${player.name} respawned`);
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
    
    ws.on('close', () => {
        if (playerId && players.has(playerId)) {
            const player = players.get(playerId);
            console.log(`Player ${player.name} (${playerId}) disconnected. Total players: ${players.size - 1}`);
            players.delete(playerId);
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Game loop
let lastTime = Date.now();
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;
    
    // Update all players
    for (const [id, player] of players) {
        updatePlayer(player, deltaTime);
    }
    
    // Check collisions
    checkCollisions();
    
    // Broadcast game state
    broadcastGameState();
}

// Initialize game
initFood();

// Start game loop
setInterval(gameLoop, 1000 / CONFIG.TICK_RATE);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║           🎮  GIGGITY.IO SERVER STARTED  🎮             ║
║                                                          ║
║  Server running on port: ${PORT}                      ║
║  WebSocket server ready for connections                 ║
║                                                          ║
║  Game Configuration:                                     ║
║  • World Size: ${CONFIG.WORLD_WIDTH}x${CONFIG.WORLD_HEIGHT}                           ║
║  • Food Count: ${CONFIG.FOOD_COUNT}                                   ║
║  • Tick Rate: ${CONFIG.TICK_RATE} Hz                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
