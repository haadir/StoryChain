'use client';

import { useState, useEffect } from 'react';
import { initSocket, getSocket } from '../lib/socket';

export default function Home() {
  const [gameState, setGameState] = useState('home'); // home, lobby, playing, waiting, results
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(3);
  const [sentence, setSentence] = useState('');
  const [lastSentence, setLastSentence] = useState('');
  const [comics, setComics] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = initSocket();

    socket.on('players-updated', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('game-started', ({ round, maxRounds }) => {
      setCurrentRound(round);
      setMaxRounds(maxRounds);
      setGameState('playing');
      setLastSentence('');
    });

    socket.on('submission-received', ({ submissionsCount, totalPlayers }) => {
      if (submissionsCount < totalPlayers) {
        setGameState('waiting');
      }
    });

    socket.on('next-round', ({ round, maxRounds, lastSentence }) => {
      setCurrentRound(round);
      setMaxRounds(maxRounds);
      setLastSentence(lastSentence);
      setGameState('playing');
      setSentence('');
    });

    socket.on('generating-comics', () => {
      setGameState('generating');
    });

    socket.on('comics-ready', (comicsData) => {
      setComics(comicsData);
      setGameState('results');
    });

    socket.on('error', (message) => {
      setError(message);
    });

    return () => socket.disconnect();
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) return;
    
    const socket = getSocket();
    socket.emit('create-room', playerName, (response) => {
      if (response.success) {
        setRoomCode(response.roomCode);
        setGameState('lobby');
        setError('');
      }
    });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    
    const socket = getSocket();
    socket.emit('join-room', roomCode.toUpperCase(), playerName, (response) => {
      if (response.success) {
        setGameState('lobby');
        setError('');
      } else {
        setError(response.error);
      }
    });
  };

  const startGame = () => {
    const socket = getSocket();
    socket.emit('start-game');
  };

  const submitSentence = () => {
    if (!sentence.trim()) return;
    
    const socket = getSocket();
    socket.emit('submit-sentence', sentence);
    setSentence('');
    setGameState('waiting');
  };

  if (gameState === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">🎭 Storychain</h1>
          <p className="text-center text-gray-600 mb-6">Create hilarious AI-generated comics with friends!</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <div className="space-y-3">
            <button
              onClick={createRoom}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Create Room
            </button>
            
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={4}
              />
              <button
                onClick={joinRoom}
                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Room {roomCode}</h2>
          <p className="text-center text-gray-600 mb-6">Share this code with friends!</p>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">Players ({players.length}):</h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={player.id} className="bg-gray-100 rounded-lg p-2">
                  {player.name}
                </div>
              ))}
            </div>
          </div>
          
          {players.length >= 2 && (
            <button
              onClick={startGame}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Start Game
            </button>
          )}
          
          {players.length < 2 && (
            <p className="text-center text-gray-500 italic">Need at least 2 players to start</p>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
            Round {currentRound} of {maxRounds}
          </h2>
          
          {lastSentence && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Continue this story:</p>
              <p className="font-medium">{lastSentence}</p>
            </div>
          )}
          
          <textarea
            placeholder={currentRound === 1 ? "Start your story..." : "Continue the story..."}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none h-32"
          />
          
          <button
            onClick={submitSentence}
            disabled={!sentence.trim()}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Waiting for others...</h2>
          <p className="text-gray-600">Other players are still writing their parts</p>
        </div>
      </div>
    );
  }

  if (gameState === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-pulse text-6xl mb-4">🤖</div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">AI is Creating Comics...</h2>
          <p className="text-gray-600">This might take a moment!</p>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-500 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">🎭 Your Comics!</h1>
          
          <div className="space-y-8">
            {Object.entries(comics).map(([playerId, comic]) => {
              const player = players.find(p => p.id === playerId);
              return (
                <div key={playerId} className="bg-white rounded-lg shadow-xl p-6">
                  <h2 className="text-xl font-bold mb-4">{player?.name}'s Story</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {comic.images?.map((imageUrl, index) => (
                      <div key={index} className="text-center">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={`Panel ${index + 1}`}
                            className="w-full h-48 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded border flex items-center justify-center">
                            <span className="text-gray-500">Image failed to load</span>
                          </div>
                        )}
                        <p className="text-sm mt-2 text-gray-600">{comic.panels[index]}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-100 rounded p-4">
                    <h3 className="font-semibold mb-2">Full Story:</h3>
                    <p className="text-gray-700">{comic.story}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-8">
            <button
              onClick={() => {
                setGameState('home');
                setPlayerName('');
                setRoomCode('');
                setPlayers([]);
                setComics({});
              }}
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
