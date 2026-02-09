# 🎮 Giggity.io - Multiplayer Browser Game

A fun multiplayer browser game inspired by Agar.io featuring Quagmire from Family Guy! Eat food, grow bigger, and dominate the leaderboard!

## 🌟 Features

- **Real-time Multiplayer** - Play with friends using WebSocket technology
- **Quagmire Theme** - Unique character design with the famous Giggity face and chin
- **Smooth Gameplay** - 60 FPS server tick rate for responsive action
- **Leaderboard** - Compete for the top spot
- **Death Animations** - Fun respawn mechanics when eaten
- **Embedded Configuration** - WebSocket URL built directly into the code

## 📁 Project Structure

```
giggity-io/
├── index.html         # Client-side game (GitHub Pages)
├── server.js          # WebSocket server (Render.com)
├── package.json       # Server dependencies
└── README.md          # This file
```

## 🚀 Quick Setup Guide

### Step 1: Deploy Server to Render.com (5 minutes)

1. **Create Render Account**
   - Go to https://render.com and sign up

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Choose "Build and deploy from a Git repository" OR "Deploy from GitHub"

3. **Upload Your Files**
   - If using Git: Push `server.js` and `package.json` to your repo
   - If manual: Upload the files directly

4. **Configure Service**
   ```
   Name: giggity-io-server (or your choice)
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free (or paid for better performance)
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment

6. **Get Your WebSocket URL**
   - Once deployed, you'll see your URL: `https://giggity-io-server.onrender.com`
   - **CONVERT TO WEBSOCKET**: Change `https://` to `wss://`
   - Your WebSocket URL: `wss://giggity-io-server.onrender.com`

### Step 2: Update index.html with Your WebSocket URL

1. **Open index.html in a text editor**

2. **Find this line (around line 216):**
   ```javascript
   const WEBSOCKET_URL = 'YOUR_RENDER_WEBSOCKET_URL_HERE';
   ```

3. **Replace with your actual URL:**
   ```javascript
   const WEBSOCKET_URL = 'wss://giggity-io-server.onrender.com';
   ```
   ⚠️ **Important:** Use `wss://` (not `https://`)

4. **Save the file**

### Step 3: Deploy to GitHub Pages (3 minutes)

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Name: `giggity-io`
   - Make it **Public**

2. **Upload Files**
   - Upload your updated `index.html` file
   - Commit the changes

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` → `/root`
   - Click "Save"

4. **Access Your Game**
   - URL: `https://YOUR-USERNAME.github.io/giggity-io/`
   - Wait 1-2 minutes for GitHub to build

### Step 4: Play!

1. Visit your GitHub Pages URL
2. Enter your name
3. Click "PLAY NOW!"
4. Share the link with friends!

## 🎮 How to Play

### Controls
- **Mouse Movement**: Your character follows your cursor
- **Objective**: Eat food (colored dots) to grow bigger
- **Strategy**: Avoid players bigger than you, eat smaller players

### Scoring
- **+1 point** per food eaten
- **+50% of their score** when you eat another player
- **Bigger = Slower**: Larger players move slower but can eat smaller ones

### Game Mechanics
- You need to be **10% larger** than another player to eat them
- When eaten, you respawn with a fresh start
- The game world has boundaries (3000x3000 pixels)

## ⚙️ Configuration

You can customize the game by editing these values:

### Server Configuration (server.js)
```javascript
const CONFIG = {
    WORLD_WIDTH: 3000,        // Game world width
    WORLD_HEIGHT: 3000,       // Game world height
    PLAYER_START_SIZE: 20,    // Starting player size
    FOOD_SIZE: 5,             // Food dot size
    FOOD_COUNT: 200,          // Number of food items
    SPEED_MULTIPLIER: 2.5,    // Movement speed
    TICK_RATE: 60,            // Server updates per second
};
```

### Client Configuration (index.html)
Match the server settings in the client for consistent gameplay.

## 🔧 Local Development & Testing

### Test Server Locally

```bash
# Install dependencies
npm install

# Start server
npm start
```

Server runs on `http://localhost:3000`

### Test Client Locally

1. Update `index.html`:
   ```javascript
   const WEBSOCKET_URL = 'ws://localhost:3000';
   ```
   Note: Use `ws://` (not `wss://`) for local testing

2. Open `index.html` in a browser or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx http-server
   ```

3. Open multiple browser tabs to test multiplayer

## 🐛 Troubleshooting

### "Please update the WEBSOCKET_URL in the code"
- You forgot to replace `YOUR_RENDER_WEBSOCKET_URL_HERE` in `index.html`
- Open the file and update line ~216 with your Render URL

### "Failed to connect to server"
- **Check URL format**: Must be `wss://` (not `https://`)
- **Wake up Render**: Free tier sleeps after 15min. Visit your Render URL in browser
- **Check deployment**: Make sure your Render service is running (green status)
- **CORS issues**: The server already has CORS enabled, but check browser console

### Connection shows "🔴 Disconnected"
- Server may be sleeping (free tier)
- Visit your Render URL to wake it up
- Check Render dashboard for errors

### Players not appearing
- Ensure connection shows "🟢 Connected"
- Open browser console (F12) and check for errors
- Try refreshing the page
- Make sure multiple tabs are open (you need 2+ players to see others)

### Game is laggy
- **Free Render tier** has cold starts (slow first connection)
- Upgrade to paid tier for 24/7 uptime
- Check your internet connection
- Reduce `TICK_RATE` in server.js to 30 for slower connections

## 📊 Server Status Page

Visit your Render URL (e.g., `https://giggity-io-server.onrender.com`) in a browser to see:
- Server status
- Active player count
- Game configuration
- WebSocket connection URL
- Setup instructions

## 🌐 Browser Support

**Fully Supported:**
- Chrome/Edge (Recommended)
- Firefox
- Safari
- Opera

**Requirements:**
- Modern browser with WebSocket support
- JavaScript enabled

## 💡 Pro Tips

1. **Wake Up Free Server**: Visit your Render URL before playing to wake it up
2. **Bookmark Your Game**: Easy access for you and friends
3. **Share the Link**: More players = more fun!
4. **Upgrade Render Plan**: $7/month for 24/7 uptime and better performance
5. **Custom Domain**: Use Render's custom domain feature for a professional URL

## 🎨 Customization Ideas

### Change Colors
Edit the `getRandomColor()` function in both files:
```javascript
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
```

### Adjust World Size
Make the world bigger or smaller:
```javascript
WORLD_WIDTH: 5000,  // Bigger world
WORLD_HEIGHT: 5000,
```

### More Food
Increase food count:
```javascript
FOOD_COUNT: 500,  // More food items
```

### Faster Gameplay
Increase speed:
```javascript
SPEED_MULTIPLIER: 5.0,  // Much faster movement
```

## 📝 Important Notes

### WebSocket URL Must Match
The URL in `index.html` must be your Render WebSocket URL:
```javascript
const WEBSOCKET_URL = 'wss://your-app.onrender.com';
```

### Free Tier Limitations
- Render free tier sleeps after 15 minutes of inactivity
- First connection after sleep takes ~30 seconds
- Upgrade to paid plan ($7/month) for always-on service

### Security
- WebSocket URL is public (it's okay, this is a game!)
- No sensitive data is transmitted
- All game logic runs on the server to prevent cheating

## 📄 License

MIT License - Feel free to modify and use!

## 🎉 Credits

- Inspired by Agar.io
- Quagmire character from Family Guy
- Built with vanilla JavaScript and WebSockets

## 🤝 Support

Having issues? Check:
1. This README's troubleshooting section
2. Browser console (F12) for error messages
3. Render service logs for server errors

---

**Enjoy playing Giggity.io! 🎮**

Share your high scores and invite friends to compete!
