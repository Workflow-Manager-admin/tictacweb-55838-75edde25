from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
import uuid

# FastAPI application instance with metadata for OpenAPI docs
app = FastAPI(
    title="Tic Tac Toe Game API",
    description="API for playing Tic Tac Toe. Create games, make moves, and check game state.",
    version="1.0.0",
    openapi_tags=[
        {"name": "game", "description": "Tic Tac Toe game management"},
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------- GAME LOGIC & MODELS --------------------------

class Move(BaseModel):
    """Data model for an incoming move."""
    x: int = Field(..., description="Row index (0-2)")
    y: int = Field(..., description="Column index (0-2)")
    player: str = Field(..., description="'X' or 'O'")

class GameState(BaseModel):
    """Data model for game state."""
    id: str = Field(..., description="Game UUID")
    board: List[List[Optional[str]]] = Field(..., description="3x3 board with cells as 'X', 'O', or None")
    current_player: str = Field(..., description="Player whose turn it is, either 'X' or 'O'")
    winner: Optional[str] = Field(default=None, description="'X', 'O', or None if game is ongoing")
    draw: bool = Field(default=False, description="True if the game is a draw")
    finished: bool = Field(default=False, description="True if the game is finished")

class NewGameResponse(BaseModel):
    """Returned when a new game is created."""
    id: str = Field(..., description="Unique game identifier")
    board: List[List[Optional[str]]] = Field(..., description="Initial game board")
    current_player: str = Field(..., description="Who starts the game (X or O)")

#---------------------- In-memory STATE ------------------------------
# For simplicity, use an in-memory dictionary to store games
games: Dict[str, GameState] = {}

#---------------------- GAME LOGIC FUNCTIONS -------------------------
# PUBLIC_INTERFACE
def check_winner(board: List[List[Optional[str]]]) -> Optional[str]:
    """Check if there's a winner."""
    # Rows, columns, diagonals
    for i in range(3):
        if board[i][0] and board[i][0] == board[i][1] == board[i][2]:
            return board[i][0]
        if board[0][i] and board[0][i] == board[1][i] == board[2][i]:
            return board[0][i]
    # Diagonals
    if board[0][0] and board[0][0] == board[1][1] == board[2][2]:
        return board[0][0]
    if board[0][2] and board[0][2] == board[1][1] == board[2][0]:
        return board[0][2]
    return None

# PUBLIC_INTERFACE
def check_draw(board: List[List[Optional[str]]]) -> bool:
    """Check if the game is a draw."""
    return all(cell for row in board for cell in row) and not check_winner(board)

# PUBLIC_INTERFACE
def next_player(current: str) -> str:
    """Switch turns."""
    return "O" if current == "X" else "X"

#---------------------- ROUTES ---------------------------------------

@app.get("/")
def health_check():
    """Check service health."""
    return {"message": "Healthy"}

# PUBLIC_INTERFACE
@app.post("/game", response_model=NewGameResponse, tags=["game"], summary="Create new game")
def create_game():
    """
    Create a new Tic Tac Toe game.
    Returns a fresh 3x3 board and a unique game ID.
    """
    game_id = str(uuid.uuid4())
    board = [[None for _ in range(3)] for _ in range(3)]
    state = GameState(
        id=game_id,
        board=board,
        current_player="X",
        winner=None,
        draw=False,
        finished=False,
    )
    games[game_id] = state
    return NewGameResponse(id=game_id, board=board, current_player="X")

# PUBLIC_INTERFACE
@app.get("/game/{game_id}", response_model=GameState, tags=["game"], summary="Get current game state")
def get_game_state(game_id: str):
    """
    Get the current board, player, and status for a given game.
    """
    game = games.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

# PUBLIC_INTERFACE
@app.post("/game/{game_id}/move", response_model=GameState, tags=["game"], summary="Make a move")
def make_move(game_id: str, move: Move):
    """
    Make a move in the given game.
    - Checks for validity
    - Updates board, checks for winner/draw, switches player
    """
    game = games.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.finished:
        raise HTTPException(status_code=400, detail="Game already finished")
    if move.player != game.current_player:
        raise HTTPException(status_code=400, detail="Not this player's turn")
    x, y = move.x, move.y
    if not (0 <= x < 3 and 0 <= y < 3):
        raise HTTPException(status_code=400, detail="Position out of bounds")
    if game.board[x][y] is not None:
        raise HTTPException(status_code=400, detail="Cell already taken")

    # Perform move
    game.board[x][y] = move.player

    # Check for winner/draw
    winner = check_winner(game.board)
    draw = check_draw(game.board)
    if winner:
        game.winner = winner
        game.finished = True
    elif draw:
        game.draw = True
        game.finished = True
    else:
        game.current_player = next_player(game.current_player)

    return game
