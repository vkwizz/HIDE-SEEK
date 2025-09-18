import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Game constants
const GRID_SIZE = 4;
const NUM_OBSTACLES = 3;
const OBSTACLE_RELOCATE_INTERVAL = 3;
const MAX_HIDER_MOVES = 10;

// Types
interface Position {
  x: number;
  y: number;
}

interface GameState {
  hiderPos: Position;
  seekerPos: Position;
  obstacles: Position[];
  hiderMoves: number;
  isGameOver: boolean;
  winner: string | null;
  message: string;
  seekerTurn: boolean;
  previousHiderPos: Position | null;
}

// A* pathfinding algorithm
function aStar(start: Position, goal: Position, obstacles: Position[]): Position[] {
  const isObstacle = (pos: Position) =>
    obstacles.some(obs => obs.x === pos.x && pos.y === pos.y);
  
  const isInBounds = (pos: Position) =>
    pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;
  
  const getNeighbors = (pos: Position): Position[] => {
    const neighbors = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 }
    ];
    return neighbors.filter(n => isInBounds(n) && !isObstacle(n));
  };
  
  const heuristic = (a: Position, b: Position) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  
  const openSet = [start];
  const cameFrom = new Map<string, Position>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  
  const posKey = (pos: Position) => `${pos.x},${pos.y}`;
  
  gScore.set(posKey(start), 0);
  fScore.set(posKey(start), heuristic(start, goal));
  
  while (openSet.length > 0) {
    const current = openSet.reduce((a, b) =>
      (fScore.get(posKey(a)) || Infinity) < (fScore.get(posKey(b)) || Infinity) ? a : b
    );
    
    if (current.x === goal.x && current.y === goal.y) {
      const path = [];
      let curr = current;
      while (cameFrom.has(posKey(curr))) {
        path.unshift(curr);
        curr = cameFrom.get(posKey(curr))!;
      }
      return path;
    }
    
    openSet.splice(openSet.indexOf(current), 1);
    
    for (const neighbor of getNeighbors(current)) {
      const tentativeGScore = (gScore.get(posKey(current)) || 0) + 1;
      const neighborKey = posKey(neighbor);
      
      if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal));
        
        if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  return [];
}

// Generate random obstacles
function randomObstacles(hiderPos: Position, seekerPos: Position): Position[] {
  const obstacles: Position[] = [];
  while (obstacles.length < NUM_OBSTACLES) {
    const pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    const isOccupied = (p: Position) =>
      (p.x === hiderPos.x && p.y === hiderPos.y) ||
      (p.x === seekerPos.x && p.y === seekerPos.y) ||
      obstacles.some(obs => obs.x === p.x && obs.y === p.y);
    
    if (!isOccupied(pos)) {
      obstacles.push(pos);
    }
  }
  return obstacles;
}

const HideAndSeekGame: React.FC = () => {
  const { toast } = useToast();
  const [gameStarted, setGameStarted] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [gameState, setGameState] = useState<GameState>({
    hiderPos: { x: 0, y: 0 },
    seekerPos: { x: 3, y: 3 },
    obstacles: [],
    hiderMoves: 0,
    isGameOver: false,
    winner: null,
    message: 'Choose your starting position and begin!',
    seekerTurn: false,
    previousHiderPos: null
  });

  // Movement mappings for keyboard controls
  const moveMap: { [key: string]: Position } = {
    'q': { x: -1, y: -1 }, 'w': { x: 0, y: -1 }, 'e': { x: 1, y: -1 },
    'a': { x: -1, y: 0 }, 's': { x: 0, y: 0 }, 'd': { x: 1, y: 0 },
    'z': { x: -1, y: 1 }, 'x': { x: 0, y: 1 }, 'c': { x: 1, y: 1 }
  };

  const startGame = useCallback(() => {
    const obstacles = randomObstacles(startPosition, { x: 3, y: 3 });
    setGameState({
      hiderPos: startPosition,
      seekerPos: { x: 3, y: 3 },
      obstacles,
      hiderMoves: 0,
      isGameOver: false,
      winner: null,
      message: 'Game started! Use QWEASDZXC keys to move.',
      seekerTurn: false,
      previousHiderPos: null
    });
    setGameStarted(true);
  }, [startPosition]);

  const isValidMove = useCallback((newPos: Position, currentState: GameState): boolean => {
    // Check bounds
    if (newPos.x < 0 || newPos.x >= GRID_SIZE || newPos.y < 0 || newPos.y >= GRID_SIZE) {
      return false;
    }
    
    // Check obstacles
    if (currentState.obstacles.some(obs => obs.x === newPos.x && obs.y === newPos.y)) {
      return false;
    }
    
    // Check backtracking
    if (currentState.previousHiderPos &&
        newPos.x === currentState.previousHiderPos.x && 
        newPos.y === currentState.previousHiderPos.y) {
      return false;
    }
    
    return true;
  }, []);

  const handleHiderMove = useCallback((direction: Position) => {
    if (gameState.isGameOver || gameState.seekerTurn) return;

    const newPos = {
      x: gameState.hiderPos.x + direction.x,
      y: gameState.hiderPos.y + direction.y
    };

    if (!isValidMove(newPos, gameState)) {
      setGameState(prev => ({ ...prev, message: 'Invalid move! Try another direction.' }));
      return;
    }

    const newMoves = gameState.hiderMoves + 1;
    
    setGameState(prev => ({
      ...prev,
      previousHiderPos: prev.hiderPos,
      hiderPos: newPos,
      hiderMoves: newMoves,
      seekerTurn: true,
      message: `Move ${newMoves}/${MAX_HIDER_MOVES} - Seeker's turn...`
    }));
  }, [gameState, isValidMove]);

  // Handle button clicks for movement
  const handleButtonMove = useCallback((key: string) => {
    if (moveMap[key] && key !== 's') { // 's' is stay in place, not allowed
      handleHiderMove(moveMap[key]);
    }
  }, [handleHiderMove, moveMap]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (moveMap[key] && key !== 's') { // 's' is stay in place, not allowed
        e.preventDefault();
        handleHiderMove(moveMap[key]);
      }
    };

    if (gameStarted && !gameState.isGameOver) {
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameState.isGameOver, handleHiderMove, moveMap]);

  // Seeker AI move
  useEffect(() => {
    if (!gameState.seekerTurn || gameState.isGameOver) return;

    const timer = setTimeout(() => {
      const path = aStar(gameState.seekerPos, gameState.hiderPos, gameState.obstacles);
      
      if (path.length > 0) {
        const newSeekerPos = path[0];
        
        // Check if seeker caught hider
        if (newSeekerPos.x === gameState.hiderPos.x && newSeekerPos.y === gameState.hiderPos.y) {
          setGameState(prev => ({
            ...prev,
            seekerPos: newSeekerPos,
            isGameOver: true,
            winner: 'Seeker',
            message: 'Seeker caught the Hider! Game Over.',
            seekerTurn: false
          }));
          toast({ title: "Game Over", description: "Seeker wins!" });
          return;
        }
        
        setGameState(prev => ({
          ...prev,
          seekerPos: newSeekerPos,
          seekerTurn: false,
          message: gameState.hiderMoves >= MAX_HIDER_MOVES ? 
            'Hider survived! You win!' : 
            `Your turn! Moves: ${gameState.hiderMoves}/${MAX_HIDER_MOVES}`
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          seekerTurn: false,
          message: 'Seeker has no path! Your turn.'
        }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameState.seekerTurn, gameState.isGameOver, gameState.seekerPos, gameState.hiderPos, gameState.obstacles, gameState.hiderMoves, toast]);

  // Check win condition for hider
  useEffect(() => {
    if (gameState.hiderMoves >= MAX_HIDER_MOVES && !gameState.seekerTurn && !gameState.isGameOver) {
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        winner: 'Hider',
        message: 'Hider survived all moves! You win!'
      }));
      toast({ title: "Victory!", description: "Hider wins!" });
    }
  }, [gameState.hiderMoves, gameState.seekerTurn, gameState.isGameOver, toast]);

  // Relocate obstacles
  useEffect(() => {
    if (gameState.hiderMoves > 0 && 
        gameState.hiderMoves % OBSTACLE_RELOCATE_INTERVAL === 0 && 
        !gameState.seekerTurn) {
      const newObstacles = randomObstacles(gameState.hiderPos, gameState.seekerPos);
      setGameState(prev => ({
        ...prev,
        obstacles: newObstacles,
        message: `Obstacles relocated! Moves: ${gameState.hiderMoves}/${MAX_HIDER_MOVES}`
      }));
      toast({ title: "Obstacles Relocated!", description: "The terrain has shifted!" });
    }
  }, [gameState.hiderMoves, gameState.seekerTurn, gameState.hiderPos, gameState.seekerPos, toast]);

  const resetGame = () => {
    setGameStarted(false);
    setGameState({
      hiderPos: { x: 0, y: 0 },
      seekerPos: { x: 3, y: 3 },
      obstacles: [],
      hiderMoves: 0,
      isGameOver: false,
      winner: null,
      message: 'Choose your starting position and begin!',
      seekerTurn: false,
      previousHiderPos: null
    });
  };

  const getCellContent = (x: number, y: number) => {
    if (gameState.hiderPos.x === x && gameState.hiderPos.y === y) return '🕵️‍♂️';
    if (gameState.seekerPos.x === x && gameState.seekerPos.y === y) return '👀';
    if (gameState.obstacles.some(obs => obs.x === x && obs.y === y)) return '🧱';
    return '';
  };

  const getCellStyle = (x: number, y: number) => {
    let baseStyle = "w-16 h-16 border-2 border-grid-border bg-grid-cell flex items-center justify-center text-2xl transition-all duration-300 hover:bg-secondary cursor-pointer";
    
    if (gameState.hiderPos.x === x && gameState.hiderPos.y === y) {
      baseStyle += " ring-2 ring-hider shadow-lg shadow-hider/20";
    } else if (gameState.seekerPos.x === x && gameState.seekerPos.y === y) {
      baseStyle += " ring-2 ring-seeker shadow-lg shadow-seeker/20";
    }
    
    return baseStyle;
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center space-y-6 p-8">
        <Card className="p-6 space-y-4 bg-card border-border shadow-tactical">
          <h2 className="text-2xl font-bold text-center text-foreground">Setup Game</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-muted-foreground">
                Hider Starting Position
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="0"
                  max={GRID_SIZE - 1}
                  value={startPosition.x}
                  onChange={(e) => setStartPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                  placeholder="X"
                  className="w-20"
                />
                <Input
                  type="number"
                  min="0"
                  max={GRID_SIZE - 1}
                  value={startPosition.y}
                  onChange={(e) => setStartPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                  placeholder="Y"
                  className="w-20"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Seeker starts at (3,3). Choose different coordinates.
              </p>
            </div>
            <Button 
              onClick={startGame} 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={startPosition.x === 3 && startPosition.y === 3}
            >
              Start Game
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-8">
      {/* Game Status */}
      <Card className="p-4 w-full max-w-md bg-card border-border shadow-tactical">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">Tactical Hide & Seek</h2>
          <p className="text-sm text-muted-foreground">{gameState.message}</p>
          <div className="flex justify-between text-sm">
            <span>Moves: {gameState.hiderMoves}/{MAX_HIDER_MOVES}</span>
            <span className={gameState.winner === 'Hider' ? 'text-hider' : gameState.winner === 'Seeker' ? 'text-seeker' : 'text-muted-foreground'}>
              {gameState.winner ? `${gameState.winner} Wins!` : 'In Progress'}
            </span>
          </div>
        </div>
      </Card>

      {/* Game Grid */}
      <Card className="p-6 bg-card border-border shadow-tactical">
        <div className="grid grid-cols-4 gap-1 mb-4">
          {Array.from({ length: GRID_SIZE }, (_, y) =>
            Array.from({ length: GRID_SIZE }, (_, x) => (
              <div
                key={`${x}-${y}`}
                className={getCellStyle(x, y)}
              >
                {getCellContent(x, y)}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-4 bg-card border-border shadow-tactical">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-2">Controls</h3>
            <div className="grid grid-cols-3 gap-1 w-32 mx-auto text-xs">
              {['Q', 'W', 'E'].map(key => (
                <Button 
                  key={key} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => handleButtonMove(key.toLowerCase())}
                  disabled={gameState.isGameOver || gameState.seekerTurn}
                >
                  {key}
                </Button>
              ))}
              {['A', 'S', 'D'].map(key => (
                <Button 
                  key={key} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  disabled={key === 'S' || gameState.isGameOver || gameState.seekerTurn}
                  onClick={() => key !== 'S' && handleButtonMove(key.toLowerCase())}
                >
                  {key}
                </Button>
              ))}
              {['Z', 'X', 'C'].map(key => (
                <Button 
                  key={key} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => handleButtonMove(key.toLowerCase())}
                  disabled={gameState.isGameOver || gameState.seekerTurn}
                >
                  {key}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">8-directional movement</p>
          </div>
          
          <Button onClick={resetGame} variant="outline" className="w-full">
            New Game
          </Button>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-card border-border shadow-tactical">
        <div className="flex justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-lg">🕵️‍♂️</span>
            <span className="text-hider">Hider</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-lg">👀</span>
            <span className="text-seeker">Seeker</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-lg">🧱</span>
            <span className="text-obstacle">Obstacle</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HideAndSeekGame;