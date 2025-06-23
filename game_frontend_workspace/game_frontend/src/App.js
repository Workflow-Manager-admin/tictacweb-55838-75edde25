import React, { useState } from 'react';
import './App.css';

// Color theme overrides (will apply via inline style or as needed)
const COLORS = {
  primary: '#1976d2',
  secondary: '#424242',
  accent: '#ff4081'
};

// Utility to calculate winner
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6] // diagonals
  ];
  for (let [a, b, c] of lines) {
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[b] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function Square({ value, onClick, highlight }) {
  /** Renders a single square of the Tic Tac Toe board. */
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      style={{
        color: value === 'X' ? COLORS.primary : COLORS.accent,
        background: highlight ? 'rgba(255, 64, 129, 0.08)' : 'transparent'
      }}
      aria-label={value ? `Cell: ${value}` : 'Empty cell'}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function Board({ squares, onSquareClick, winLine }) {
  /** Renders the 3x3 Tic Tac Toe board. */
  function renderSquare(i) {
    return (
      <Square
        key={i}
        value={squares[i]}
        onClick={() => onSquareClick(i)}
        highlight={winLine && winLine.includes(i)}
      />
    );
  }
  return (
    <div className="ttt-board">
      {[0, 1, 2].map(row =>
        <div key={row} className="ttt-board-row">
          {[0, 1, 2].map(col =>
            renderSquare(row * 3 + col)
          )}
        </div>
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
function StatusPanel({ winner, isDraw, xIsNext }) {
  /** Displays game status: whose turn, winner, or draw. */
  let message;
  if (winner) {
    message = (
      <>
        <span style={{ color: winner === "X" ? COLORS.primary : COLORS.accent, fontWeight: 600 }}>
          {winner}
        </span>{" "}
        wins!
      </>
    );
  } else if (isDraw) {
    message = 'Game Draw!';
  } else {
    message = (
      <>
        Next: <span style={{ color: xIsNext ? COLORS.primary : COLORS.accent, fontWeight: 600 }}>
          {xIsNext ? "X" : "O"}
        </span>
      </>
    );
  }
  return (
    <div className="ttt-status-panel" aria-live="polite">
      {message}
    </div>
  );
}

// PUBLIC_INTERFACE
function GameControls({ onReset, canReset }) {
  /** Renders Reset/New Game button. */
  return (
    <div className="ttt-controls">
      <button
        className="btn btn-large"
        style={{
          background: COLORS.accent,
          color: 'white'
        }}
        onClick={onReset}
        disabled={!canReset}
      >{canReset ? "Start New Game" : "Reset"}</button>
    </div>
  );
}

// Finds the winning line (return indices array), or null
function getWinningLine(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (let line of lines) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return line;
    }
  }
  return null;
}

export default function App() {
  // State for the cells, xIsNext (player toggle), and hasStarted (for reset behavior)
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Winner and draw logic
  const winner = calculateWinner(squares);
  const winLine = getWinningLine(squares);
  const isBoardFull = squares.every(Boolean);
  const isDraw = !winner && isBoardFull;

  function handleSquareClick(i) {
    if (winner || squares[i]) {
      return;
    }
    const newSquares = squares.slice();
    newSquares[i] = xIsNext ? 'X' : 'O';
    setSquares(newSquares);
    setXIsNext(!xIsNext);
    setHasStarted(true);
  }

  function handleReset() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setHasStarted(false);
  }

  // Main app UI
  return (
    <div className="app" style={{ background: 'white', minHeight: '100vh', color: COLORS.secondary }}>
      <nav className="navbar" style={{ background: COLORS.primary }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol" style={{ color: COLORS.accent, fontWeight: 700 }}>&#x25A3;</span>
              Tic Tac Toe
            </div>
            <span style={{ opacity: 0.65, fontWeight: 500 }}>by Kavia AI</span>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="ttt-game-wrapper">
            <StatusPanel winner={winner} isDraw={isDraw} xIsNext={xIsNext} />
            <Board squares={squares} onSquareClick={handleSquareClick} winLine={winLine} />
            <GameControls onReset={handleReset} canReset={hasStarted || winner || isDraw} />
          </div>
        </div>
      </main>

      {/* Minimal footer or credits can go here if desired */}
    </div>
  );
}
