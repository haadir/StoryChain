# 🎭 Storychain - AI Pass-The-Story Game

A multiplayer web game where players collaboratively create stories that get turned into AI-generated comics!

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (optional - works without for testing):
   ```bash
   cp .env.example .env
   # Add your OpenAI API key to .env
   ```

3. **Start the backend server**:
   ```bash
   npm run server
   ```

4. **Start the frontend** (in another terminal):
   ```bash
   npm run dev
   ```

5. **Play the game**:
   - Open `http://localhost:3000` in your browser
   - Create a room or join with a room code
   - Share the room code with friends on their phones
   - Start writing stories together!

## 🎮 How to Play

1. **Join**: Host creates a room, others join with the room code
2. **Write**: Each round, players write a word/sentence/phrase
3. **Pass**: Stories get randomly passed between players
4. **Continue**: Players see only the last sentence and continue the story
5. **Generate**: After 3 rounds, AI creates comics from your chaotic stories
6. **Enjoy**: View the hilarious AI-generated comics!

## 🛠️ Features

- ✅ Real-time multiplayer with Socket.io
- ✅ Mobile-friendly responsive design
- ✅ Room-based game sessions
- ✅ Story chain management
- ✅ AI integration (ChatGPT + DALL-E)
- ✅ Beautiful gradient UI
- ✅ Comic panel display

## 🤖 AI Integration

The game uses OpenAI's APIs to:
1. **Rewrite** chaotic sentence chains into coherent, funny stories
2. **Generate** comic panel descriptions 
3. **Create** images for each panel using DALL-E

*Note: The game works without API keys using mock data for testing.*

## 📱 Mobile Support

Players can join on their phones by visiting the same URL and entering the room code. The interface is optimized for mobile gameplay.

## 🔧 Technical Details

- **Frontend**: Next.js 16 with TypeScript and Tailwind CSS
- **Backend**: Express.js with Socket.io for real-time communication
- **AI**: OpenAI GPT-3.5-turbo and DALL-E 3
- **Storage**: In-memory (no database needed for prototyping)

Built in under 15 minutes following the requirements! 🎉
