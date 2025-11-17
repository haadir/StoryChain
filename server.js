const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const OpenAI = require('openai');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// In-memory storage
const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (playerName, callback) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      players: [{ id: socket.id, name: playerName, socketId: socket.id }],
      roomCode,
      currentRound: 0,
      maxRounds: 3,
      submissions: {},
      chains: {},
      comics: {},
      gamePhase: 'lobby' // lobby, playing, generating, results
    };
    
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    callback({ success: true, roomCode });
    io.to(roomCode).emit('players-updated', rooms[roomCode].players);
  });

  socket.on('join-room', (roomCode, playerName, callback) => {
    const room = rooms[roomCode];
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    if (room.gamePhase !== 'lobby') {
      callback({ success: false, error: 'Game already in progress' });
      return;
    }

    room.players.push({ id: socket.id, name: playerName, socketId: socket.id });
    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    callback({ success: true });
    io.to(roomCode).emit('players-updated', room.players);
  });

  socket.on('start-game', () => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    
    if (!room || room.players.length < 2) return;
    
    room.gamePhase = 'playing';
    room.currentRound = 1;
    room.submissions = {};
    
    // Initialize chains with each player's ID
    room.players.forEach(player => {
      room.chains[player.id] = [];
    });
    
    io.to(roomCode).emit('game-started', {
      round: room.currentRound,
      maxRounds: room.maxRounds
    });
  });

  socket.on('submit-sentence', (sentence) => {
    const roomCode = socket.roomCode;
    const room = rooms[roomCode];
    
    if (!room) return;
    
    room.submissions[socket.id] = sentence;
    
    // Check if all players have submitted
    if (Object.keys(room.submissions).length === room.players.length) {
      processRound(roomCode);
    }
    
    io.to(roomCode).emit('submission-received', {
      playerId: socket.id,
      submissionsCount: Object.keys(room.submissions).length,
      totalPlayers: room.players.length
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode]) {
      rooms[roomCode].players = rooms[roomCode].players.filter(p => p.id !== socket.id);
      
      if (rooms[roomCode].players.length === 0) {
        delete rooms[roomCode];
      } else {
        io.to(roomCode).emit('players-updated', rooms[roomCode].players);
      }
    }
  });
});

function processRound(roomCode) {
  const room = rooms[roomCode];
  
  // Get all submissions
  const submissions = Object.entries(room.submissions);
  const playerIds = submissions.map(([playerId]) => playerId);
  
  if (room.currentRound === 1) {
    // First round: assign submissions to original chains
    submissions.forEach(([playerId, sentence]) => {
      room.chains[playerId].push(sentence);
    });
  } else {
    // Subsequent rounds: randomly redistribute
    const shuffledPlayerIds = shuffleArray(playerIds);
    
    submissions.forEach(([playerId, sentence], index) => {
      // Get a different player's chain (avoid self if possible)
      let targetPlayerId = shuffledPlayerIds[index];
      if (targetPlayerId === playerId && shuffledPlayerIds.length > 1) {
        // Find a different target
        targetPlayerId = shuffledPlayerIds.find(id => id !== playerId) || shuffledPlayerIds[0];
      }
      
      room.chains[targetPlayerId].push(sentence);
    });
  }
  
  // Clear submissions for next round
  room.submissions = {};
  
  if (room.currentRound < room.maxRounds) {
    // Next round
    room.currentRound++;
    
    // Send each player the last sentence from their current chain
    room.players.forEach(player => {
      const chainForPlayer = Object.keys(room.chains).find(chainOwner => {
        return room.chains[chainOwner].length > 0;
      });
      
      const lastSentence = room.chains[chainForPlayer] ? 
        room.chains[chainForPlayer][room.chains[chainForPlayer].length - 1] : '';
      
      io.to(player.socketId).emit('next-round', {
        round: room.currentRound,
        maxRounds: room.maxRounds,
        lastSentence
      });
    });
  } else {
    // Game over, generate comics
    room.gamePhase = 'generating';
    io.to(roomCode).emit('generating-comics');
    generateComics(roomCode);
  }
}

async function generateComics(roomCode) {
  const room = rooms[roomCode];
  
  try {
    for (const [playerId, sentences] of Object.entries(room.chains)) {
      if (sentences.length === 0) continue;
      
      if (!openai) {
        // Mock data for testing without API key
        room.comics[playerId] = {
          story: `Here's a funny story: ${sentences.join(' ')} And they all lived hilariously ever after!`,
          panels: [
            "Panel 1: The adventure begins with our heroes in an unexpected situation",
            "Panel 2: Things get more complicated as chaos ensues", 
            "Panel 3: A surprising twist changes everything",
            "Panel 4: The hilarious conclusion that nobody saw coming"
          ],
          images: [null, null, null, null] // Placeholder for testing
        };
        continue;
      }
      
      // Step 1: Rewrite as coherent story
      const storyPrompt = `Rewrite the following chaotic sentences into one coherent, funny short story (6-10 lines).
      
Sentences:
${sentences.join(' ')}`;

      const storyResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: storyPrompt }],
        max_tokens: 200
      });
      
      const rewrittenStory = storyResponse.choices[0].message.content;
      
      // Step 2: Convert to comic panels
      const panelPrompt = `Split the following story into exactly 4 comic panel descriptions.
Each description should be 1-2 sentences and visual.

Story:
${rewrittenStory}`;

      const panelResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: panelPrompt }],
        max_tokens: 300
      });
      
      const panels = panelResponse.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 4);
      
      // Step 3: Generate images (placeholder for now)
      const images = await Promise.all(
        panels.map(async (panel) => {
          try {
            const imageResponse = await openai.images.generate({
              model: "dall-e-3",
              prompt: `Comic book style illustration: ${panel}`,
              size: "1024x1024",
              quality: "standard",
              n: 1
            });
            return imageResponse.data[0].url;
          } catch (error) {
            console.error('Image generation failed:', error);
            return null;
          }
        })
      );
      
      room.comics[playerId] = {
        story: rewrittenStory,
        panels,
        images: images.filter(img => img !== null)
      };
    }
    
    room.gamePhase = 'results';
    io.to(roomCode).emit('comics-ready', room.comics);
    
  } catch (error) {
    console.error('Error generating comics:', error);
    io.to(roomCode).emit('error', 'Failed to generate comics. Please try again.');
  }
}

// Handle Next.js requests
app.all('*', (req, res) => {
  return handle(req, res);
});

const PORT = process.env.PORT || 3000;

nextApp.prepare().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});