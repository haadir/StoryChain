📝 AI Pass-The-Story Game — Requirements & Implementation Plan
🎯 Goal

Build a simple multiplayer web game where:

Each player adds a word/sentence each round

Sentences get passed to random players

After a few rounds each chain of sentences becomes a story

ChatGPT rewrites the story + generates comic panel descriptions

An image model generates images → resulting in a funny AI comic

Game must run in a browser and players join on their phones.

📌 1. Core Requirements
1.1 Game Flow

Players Join

Host creates a room → gets a room code

Players join via phone using URL + room code

Players enter a name

Round Start

All players receive a text box

They write either:

1 word

1 phrase

1 sentence

(configurable)

Pass The Submission

At the end of the round, each player's submission is randomly passed to another player

Player receives only the last sentence in that story chain

Player continues the story

Repeat

3–5 rounds (configurable)

Story Assembly

Each initial player's thread forms one story list
Example:

Story 1 = P1 → P3 → P6 → P2 → P1

Story 2 = P2 → P5 → P4 → P1 → P3

There will be #players stories total.

AI Generation
For each story chain:

ChatGPT rewrites into coherent funny story

ChatGPT breaks it into 4 comic panel descriptions

Image model generates 4 images

Results

Each player sees all comics

Optional: voting for “Funniest Comic,” “Craziest Story,” etc.

📌 2. Functional Requirements
2.1 Lobby System

Create a unique room code

Track connected players

Show player list on host screen

2.2 Messaging / Realtime

Synchronize all players for:

Start round

Submit sentence

Pass sentence

Show results

WebSockets or polling both fine.

2.3 Storage (temporary in-memory)

Data stored while game is active:

{
  players: [ { id, name, socketId } ],
  roomCode: "ABCD",
  currentRound: 1,
  submissions: { playerId: "sentence" },
  chains: {
    playerId: ["sentence1", "sentence2", ...]  // one chain per original player
  },
  comics: { playerId: { panels: [...] } }
}

2.4 Round Logic

Collect input from each player

Randomly map submissions:

newOwner = randomPlayerExceptSelf()


Append the new submission into the chain.

2.5 AI Pipeline

After story chains assembled:

Step 1 — Rewrite as a funny story

Prompt:

Rewrite the following chaotic sentences into one coherent, funny short story (6–10 lines).
Sentences:
{list}

Step 2 — Convert to comic panels

Prompt:

Split the following story into exactly 4 comic panel descriptions.
Each description should be 1–2 sentences and visual.

Step 3 — Image Generation

Call image model with each of the 4 descriptions

Store or send base64 back to client

📌 3. Non-Functional Requirements

Fast to prototype: no database needed

Mobile-friendly

Simple UI: text box + cards

AI reliability: retry if GPT returns null

Lightweight: can host on Vercel or local Node server

📌 4. Implementation Plan (Step-by-Step)
Step 0 — Setup

Create folder: ai-pass-story

Install:

Next.js or Express + Vite frontend

Socket.io or WebSocket library

OpenAI client

⚙️ Step 1 — Backend (Server)
1.1 Create server

Node.js

Express for endpoints

Socket.io for realtime

1.2 Room Manager

In-memory object:

rooms = {
  roomCode: {
    players: [],
    chains: {},
    submissions: {}
  }
}

1.3 Events

join-room

start-game

submit-sentence

round-over

game-over

send-comics

1.4 Round Logic

When all players submit:

Randomly reassign sentences

Push to chains

Move to next round

🖥️ Step 2 — Frontend
2.1 Screens

Home – enter name + room code

Lobby – waiting for start

Round – text box + submit button

Waiting – “Waiting for other players…”

Results/Comics – grid of 4 images per story

2.2 UI Tools

TailwindCSS (fast)

Minimal components

🤖 Step 3 — AI Integration
3.1 After final round

For each story chain:

Call GPT:

rewrite story

generate 4 panel descriptions

Call image model:

generate 4 images

return base64 strings

3.2 Store

Place in:

room.comics[playerId]

🎨 Step 4 — Results Page

Show:

Story Title (auto from GPT or Player’s original submission)

Four Panels → image + caption

Optional:

Voting mode

Shareable link

Download comic as PNG

🧪 Step 5 — Testing Checklist

Test join flow with multiple phones

Test passing logic (no one gets their own sentence unless last round)

Test AI flow

Test loading screens for images

Make sure rooms clean up on exit

🚀 Step 6 — Stretch Features (Optional)

Player avatars

Voice-to-text

Emojis

Timer per round

Comic sound effects (“BOOM”, “WOW”)

“Director Mode” where 1 player chooses themes

Save comics to gallery

📦 Deliverables

One server file (rooms, sockets, AI calls)

One frontend with 4–5 pages

One flow: join → rounds → AI → finished comics

If you want, I can also generate:

✅ A Next.js boilerplate with WebSockets + routes
✅ All the ChatGPT prompts pre-written
✅ The exact code structure folders
Just tell me “give me the code skeleton” and I’ll generate it.