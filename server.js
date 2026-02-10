<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Giggity.io - Multiplayer Game</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            overflow: hidden;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        #gameCanvas {
            display: block;
            background: #f0f0f0;
            cursor: none;
        }

        #ui {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        #startScreen {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            pointer-events: all;
        }

        #startScreen h1 {
            font-size: 60px;
            color: #667eea;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }

        #startScreen .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 30px;
        }

        input {
            padding: 15px;
            font-size: 18px;
            border: 2px solid #667eea;
            border-radius: 10px;
            width: 300px;
            margin-bottom: 15px;
            outline: none;
        }

        #playButton {
            padding: 15px 60px;
            font-size: 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }

        #playButton:hover {
            background: #764ba2;
            transform: scale(1.05);
        }

        #stats {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px 20px;
            border-radius: 10px;
            font-size: 16px;
            color: #333;
        }

        #leaderboard {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px 20px;
            border-radius: 10px;
            min-width: 200px;
            max-height: 300px;
            overflow-y: auto;
        }

        #leaderboard h3 {
            margin-bottom: 10px;
            color: #667eea;
            text-align: center;
        }

        .leaderboard-item {
            padding: 5px 0;
            font-size: 14px;
        }

        #connectionStatus {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
        }

        .connected {
            color: green;
        }

        .disconnected {
            color: red;
        }

        .connecting {
            color: orange;
        }

        #deathScreen {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            background: rgba(255, 0, 0, 0.9);
            padding: 40px;
            border-radius: 20px;
            color: white;
            display: none;
            pointer-events: all;
        }

        #instructions {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 10px;
            font-size: 12px;
            max-width: 200px;
        }

        #instructions h4 {
            color: #667eea;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <div id="ui">
        <div id="startScreen">
            <h1>🎮 GIGGITY.IO</h1>
            <div class="subtitle">Eat food, avoid bigger players, dominate!</div>
            
            <input type="text" id="nameInput" placeholder="Enter your name" maxlength="15" value="Quagmire">
            
            <br><br>
            <button id="playButton">PLAY NOW!</button>
            <div style="margin-top: 20px; font-size: 12px; color: #999;">
                🎯 Move with mouse • Eat food to grow • Avoid bigger players
            </div>
        </div>

        <div id="deathScreen">
            <h2>💀 YOU DIED!</h2>
            <p id="deathMessage" style="margin: 20px 0; font-size: 18px;"></p>
            <button id="respawnButton" style="padding: 15px 40px; font-size: 18px; background: white; color: #667eea; border: none; border-radius: 10px; cursor: pointer;">
                RESPAWN
            </button>
        </div>

        <div id="stats" style="display: none;">
            <div><strong>Score:</strong> <span id="score">0</span></div>
            <div><strong>Players:</strong> <span id="playerCount">1</span></div>
        </div>

        <div id="leaderboard" style="display: none;">
            <h3>🏆 Leaderboard</h3>
            <div id="leaderboardList"></div>
        </div>

        <div id="instructions" style="display: none;">
            <h4>📖 How to Play</h4>
            <div>• Move mouse to navigate</div>
            <div>• Eat dots to grow</div>
            <div>• Eat smaller players</div>
            <div>• Avoid bigger players</div>
        </div>

        <div id="connectionStatus">
            <span class="disconnected">⚫ Not Connected</span>
        </div>
    </div>

    <script>
        // ============================================
        // CONFIGURATION
        // ============================================
        const WEBSOCKET_URL = 'wss://gigidy.onrender.com';
        const DEFAULT_CHARACTER_IMAGE = 'images.jfif';
        // ============================================

        // Game Configuration
        const CONFIG = {
            WORLD_WIDTH: 2000,
            WORLD_HEIGHT: 2000,
            PLAYER_START_SIZE: 20,
            FOOD_SIZE: 5,
            FOOD_COUNT: 50,
            SPEED_MULTIPLIER: 3,
        };

        // Game state
        let canvas, ctx;
        let gameStarted = false;
        let ws = null;
        
        let player = {
            id: null,
            x: 0,
            y: 0,
            displayX: 0, // For smooth interpolation
            displayY: 0,
            size: CONFIG.PLAYER_START_SIZE,
            name: '',
            score: 0,
            color: '#FF6B6B',
            imageUrl: null,
            image: null
        };

        let otherPlayers = new Map();
        let playerImages = new Map();
        let food = [];
        let camera = { x: 0, y: 0, zoom: 1 };
        let mouse = { x: 0, y: 0 };
        let reconnectAttempts = 0;
        let maxReconnectAttempts = 5;

        // Smooth interpolation
        function lerp(start, end, factor) {
            return start + (end - start) * factor;
        }

        // Initialize
        function init() {
            canvas = document.getElementById('gameCanvas');
            ctx = canvas.getContext('2d');
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            });

            document.getElementById('playButton').addEventListener('click', startGame);
            document.getElementById('respawnButton').addEventListener('click', respawn);
            document.getElementById('nameInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') startGame();
            });

            requestAnimationFrame(gameLoop);
        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function loadImage(url) {
            return new Promise((resolve) => {
                if (!url) {
                    resolve(null);
                    return;
                }
                
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    console.log('✅ Image loaded:', url);
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn('❌ Failed to load image:', url);
                    resolve(null);
                };
                img.src = url;
            });
        }

        async function startGame() {
            const name = document.getElementById('nameInput').value.trim() || 'Quagmire';
            
            player.name = name;
            player.color = getRandomColor();
            player.imageUrl = DEFAULT_CHARACTER_IMAGE;
            
            // Load custom image
            if (DEFAULT_CHARACTER_IMAGE) {
                player.image = await loadImage(DEFAULT_CHARACTER_IMAGE);
            }
            
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('stats').style.display = 'block';
            document.getElementById('leaderboard').style.display = 'block';
            document.getElementById('instructions').style.display = 'block';
            
            gameStarted = true;
            connectWebSocket();
        }

        function respawn() {
            document.getElementById('deathScreen').style.display = 'none';
            player.score = 0;
            player.size = CONFIG.PLAYER_START_SIZE;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'respawn' }));
            }
        }

        function connectWebSocket() {
            try {
                updateConnectionStatus('connecting');
                ws = new WebSocket(WEBSOCKET_URL);
                
                ws.onopen = () => {
                    console.log('✅ Connected to server');
                    updateConnectionStatus('connected');
                    reconnectAttempts = 0;
                    
                    ws.send(JSON.stringify({
                        type: 'join',
                        name: player.name,
                        color: player.color,
                        imageUrl: player.imageUrl
                    }));
                };

                ws.onmessage = (event) => {
                    handleServerMessage(JSON.parse(event.data));
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    updateConnectionStatus('disconnected');
                };

                ws.onclose = () => {
                    console.log('🔴 Disconnected from server');
                    updateConnectionStatus('disconnected');
                    
                    if (gameStarted && reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        setTimeout(() => {
                            console.log(`🔄 Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`);
                            connectWebSocket();
                        }, 3000);
                    }
                };
            } catch (error) {
                console.error('Failed to connect:', error);
            }
        }

        async function handleServerMessage(data) {
            switch (data.type) {
                case 'init':
                    player.id = data.id;
                    player.x = data.x;
                    player.y = data.y;
                    player.displayX = data.x;
                    player.displayY = data.y;
                    break;
                    
                case 'gameState':
                    otherPlayers.clear();
                    for (const p of data.players) {
                        if (p.id !== player.id) {
                            otherPlayers.set(p.id, p);
                            
                            if (p.imageUrl && !playerImages.has(p.id)) {
                                loadImage(p.imageUrl).then(img => {
                                    if (img) playerImages.set(p.id, img);
                                });
                            }
                        } else {
                            // Smooth interpolation to server position
                            player.x = p.x;
                            player.y = p.y;
                            player.size = p.size;
                            player.score = p.score;
                        }
                    }
                    
                    food = data.food;
                    document.getElementById('playerCount').textContent = data.players.length;
                    updateLeaderboard(data.players);
                    break;

                case 'death':
                    showDeathScreen(data.killedBy);
                    break;
            }
        }

        function showDeathScreen(killerName) {
            const deathScreen = document.getElementById('deathScreen');
            const deathMessage = document.getElementById('deathMessage');
            
            deathMessage.textContent = `You were eaten by ${killerName}!`;
            deathScreen.style.display = 'block';
            
            setTimeout(() => {
                if (deathScreen.style.display === 'block') {
                    respawn();
                }
            }, 3000);
        }

        function updateConnectionStatus(status) {
            const statusEl = document.getElementById('connectionStatus');
            if (status === 'connected') {
                statusEl.innerHTML = '<span class="connected">🟢 Connected</span>';
            } else if (status === 'connecting') {
                statusEl.innerHTML = '<span class="connecting">🟡 Connecting...</span>';
            } else {
                statusEl.innerHTML = '<span class="disconnected">🔴 Disconnected</span>';
            }
        }

        function updateLeaderboard(players) {
            const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 10);
            const list = document.getElementById('leaderboardList');
            
            list.innerHTML = sorted.map((p, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                const isMe = p.id === player.id ? ' <strong>(You)</strong>' : '';
                return `<div class="leaderboard-item">${medal} ${p.name}: ${p.score}${isMe}</div>`;
            }).join('');
        }

        // Heavily throttled movement updates
        let lastMoveSent = 0;
        const moveThrottle = 200; // Send updates very infrequently

        function gameLoop(timestamp) {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        function update() {
            if (!gameStarted) return;

            // Smooth interpolation for display position
            player.displayX = lerp(player.displayX, player.x, 0.3);
            player.displayY = lerp(player.displayY, player.y, 0.3);

            // Send movement (heavily throttled)
            const now = Date.now();
            if (ws && ws.readyState === WebSocket.OPEN && now - lastMoveSent > moveThrottle) {
                const worldX = (mouse.x - canvas.width / 2) / camera.zoom + camera.x;
                const worldY = (mouse.y - canvas.height / 2) / camera.zoom + camera.y;
                
                ws.send(JSON.stringify({
                    type: 'move',
                    targetX: worldX,
                    targetY: worldY
                }));
                
                lastMoveSent = now;
            }

            // Update camera to display position
            camera.x = player.displayX;
            camera.y = player.displayY;
            camera.zoom = Math.max(0.5, 1 - player.size / 300);

            document.getElementById('score').textContent = player.score;
        }

        function render() {
            // Clear
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            
            // Camera
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(camera.zoom, camera.zoom);
            ctx.translate(-camera.x, -camera.y);

            // Grid
            drawGrid();

            // Food
            ctx.fillStyle = '#666';
            food.forEach(f => {
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.arc(f.x, f.y, CONFIG.FOOD_SIZE, 0, Math.PI * 2);
                ctx.fill();
            });

            // Other players
            otherPlayers.forEach(p => {
                drawPlayer(p, playerImages.get(p.id));
            });

            // Main player (use display position)
            if (gameStarted) {
                const displayPlayer = {...player, x: player.displayX, y: player.displayY};
                drawPlayer(displayPlayer, player.image);
            }

            ctx.restore();

            // Cursor
            drawCursor();
        }

        function drawGrid() {
            const gridSize = 50;
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 1;

            const startX = Math.floor((camera.x - canvas.width / 2 / camera.zoom) / gridSize) * gridSize;
            const endX = Math.ceil((camera.x + canvas.width / 2 / camera.zoom) / gridSize) * gridSize;
            const startY = Math.floor((camera.y - canvas.height / 2 / camera.zoom) / gridSize) * gridSize;
            const endY = Math.ceil((camera.y + canvas.height / 2 / camera.zoom) / gridSize) * gridSize;

            for (let x = startX; x <= endX; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
                ctx.stroke();
            }

            for (let y = startY; y <= endY; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
                ctx.stroke();
            }
        }

        function drawPlayer(p, customImage) {
            // Circle
            ctx.fillStyle = p.color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Image or face
            if (customImage) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.clip();
                
                const imgSize = p.size * 2;
                ctx.drawImage(customImage, p.x - p.size, p.y - p.size, imgSize, imgSize);
                ctx.restore();
            } else {
                // Simple Quagmire face
                const s = p.size;
                
                // Eyes
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(p.x - s * 0.25, p.y - s * 0.15, s * 0.15, 0, Math.PI * 2);
                ctx.arc(p.x + s * 0.25, p.y - s * 0.15, s * 0.15, 0, Math.PI * 2);
                ctx.fill();
                
                // Pupils
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(p.x - s * 0.25, p.y - s * 0.15, s * 0.08, 0, Math.PI * 2);
                ctx.arc(p.x + s * 0.25, p.y - s * 0.15, s * 0.08, 0, Math.PI * 2);
                ctx.fill();

                // Smile
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y + s * 0.1, s * 0.4, 0.2, Math.PI - 0.2);
                ctx.stroke();

                // Chin
                ctx.fillStyle = p.color;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y + s * 0.6, s * 0.2, s * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Name
            ctx.fillStyle = '#000';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.font = `bold ${Math.max(12, p.size / 3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeText(p.name, p.x, p.y - p.size - 15);
            ctx.fillText(p.name, p.x, p.y - p.size - 15);
        }

        function drawCursor() {
            // Simple dot
            ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        function getRandomColor() {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        init();
    </script>
</body>
</html>
