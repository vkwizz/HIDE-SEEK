# Tactical Hide & Seek - Strategic Grid Game

A turn-based tactical hide-and-seek game built with React, TypeScript, and Vite.  
Play as the Hider and try to survive 10 moves while the Seeker uses pathfinding AI to catch you!

---

## Features

- **4x4 Grid:** Compact board for strategic movement.
- **Obstacles:** Randomly placed and relocated every 3 moves.
- **Seeker AI:** Uses A* pathfinding to chase the Hider.
- **Hider Controls:** Move in 8 directions using QWEASDZXC keys or on-screen buttons.
- **Win Conditions:** Survive 10 moves to win as Hider, or get caught by the Seeker.
- **Responsive UI:** Built with shadcn/ui and styled for clarity.

---

## Getting Started

### Prerequisites

- [Node.js 20.x LTS](https://nodejs.org/en/download/)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/vkwizz/HIDE-SEEK.git
   cd HIDE-SEEK
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```

4. Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## How to Play

1. **Setup:**  
   - Choose your starting position for the Hider (top-left by default).
   - Seeker always starts at (3,3).

2. **Controls:**  
   - Use QWEASDZXC keys or on-screen buttons for 8-directional movement.
   - Avoid obstacles and the Seeker.

3. **Turns:**  
   - Each move, the Seeker will chase you using pathfinding.
   - Obstacles relocate every 3 moves.

4. **Win:**  
   - Survive 10 moves to win as Hider.
   - If the Seeker catches you, you lose.

---

## Tech Stack

- **React** & **TypeScript**
- **Vite** (fast dev server)
- **shadcn/ui** (UI components)
- **A* Pathfinding** (Seeker AI)

---

## Contributing

Pull requests are welcome!  
For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT

---

## Credits

- Game logic and UI by [vkwizz](https://github.com/vkwizz)
- Inspired by classic grid-based strategy games.
