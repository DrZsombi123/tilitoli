class TiliToli {
    constructor() {
        this.boardSize = 4;
        this.tiles = []; // Array to hold tile values. 0 represents the empty space.
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isPlaying = false;

        // DOM Elements
        this.boardEl = document.getElementById('game-board');
        this.moveCountEl = document.getElementById('move-count');
        this.timerEl = document.getElementById('timer');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.sizeBtns = document.querySelectorAll('.size-btn');
        this.winModal = document.getElementById('win-modal');
        this.modalCloseBtn = document.getElementById('modal-close-btn');
        this.finalTimeEl = document.getElementById('final-time');
        this.finalMovesEl = document.getElementById('final-moves');

        // Image Upload Elements
        this.imageUpload = document.getElementById('image-upload');
        this.removeImageBtn = document.getElementById('remove-image-btn');
        this.currentImage = null; // Stores Base64 string

        this.init();
    }

    init() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.modalCloseBtn.addEventListener('click', () => this.closeModal());

        this.sizeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.sizeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.boardSize = parseInt(e.target.dataset.size);
                this.startNewGame();
            });
        });

        // Image Upload Listeners
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.removeImageBtn.addEventListener('click', () => this.removeImage());

        this.startNewGame();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentImage = e.target.result;
                this.removeImageBtn.classList.remove('hidden');
                this.renderBoard(); // Re-render with new image
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        this.currentImage = null;
        this.imageUpload.value = ''; // Reset input
        this.removeImageBtn.classList.add('hidden');
        this.renderBoard();
    }

    startNewGame() {
        this.stopTimer();
        this.resetStats();
        this.generateBoard();
        this.shuffleBoard(); // This mimics moves to ensure solvability
        this.renderBoard();
        this.startTimer();
        this.isPlaying = true;
    }

    resetStats() {
        this.moves = 0;
        this.timer = 0;
        this.updateStatsUI();
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    startTimer() {
        this.stopTimer(); // Ensure no duplicates
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateStatsUI();
        }, 1000);
    }

    updateStatsUI() {
        this.moveCountEl.textContent = this.moves;

        const minutes = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        this.timerEl.textContent = `${minutes}:${seconds}`;
    }

    generateBoard() {
        // Initialize solved board
        this.tiles = [];
        const totalTiles = this.boardSize * this.boardSize;
        for (let i = 1; i < totalTiles; i++) {
            this.tiles.push(i);
        }
        this.tiles.push(0); // 0 is empty

        // Set grid CSS
        this.boardEl.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        this.boardEl.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;
    }

    shuffleBoard() {
        // To ensure solvability, we simulate random valid moves instead of randomizing the array
        // 100 * boardSize moves should be sufficient randomization
        const shuffleMoves = 150 * this.boardSize;

        // Temporarily disable animation during shuffle if we want instant setup, 
        // but since we are just manipulating the array, we don't render until the end.

        let previousIndex = -1;

        for (let i = 0; i < shuffleMoves; i++) {
            const emptyIndex = this.tiles.indexOf(0);
            const validMoves = this.getAdjacentIndices(emptyIndex);

            // Filter out the move that would undo the immediate last move to encourage more mixing
            const candidates = validMoves.filter(idx => idx !== previousIndex);
            // Fallback to all valid moves if dead end (shouldn't happen in grid)
            const moveIndex = candidates.length > 0
                ? candidates[Math.floor(Math.random() * candidates.length)]
                : validMoves[Math.floor(Math.random() * validMoves.length)];

            // Swap in data only
            [this.tiles[emptyIndex], this.tiles[moveIndex]] = [this.tiles[moveIndex], this.tiles[emptyIndex]];
            previousIndex = emptyIndex;
        }
    }

    getAdjacentIndices(index) {
        const moves = [];
        const row = Math.floor(index / this.boardSize);
        const col = index % this.boardSize;

        if (row > 0) moves.push(index - this.boardSize); // Up
        if (row < this.boardSize - 1) moves.push(index + this.boardSize); // Down
        if (col > 0) moves.push(index - 1); // Left
        if (col < this.boardSize - 1) moves.push(index + 1); // Right

        return moves;
    }

    handleTileClick(index) {
        if (!this.isPlaying) return;

        const emptyIndex = this.tiles.indexOf(0);
        if (this.isAdjacent(index, emptyIndex)) {
            // Swap
            [this.tiles[index], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[index]];
            this.moves++;
            this.updateStatsUI();
            this.renderBoard();
            this.checkWin();
        }
    }

    isAdjacent(idx1, idx2) {
        const r1 = Math.floor(idx1 / this.boardSize);
        const c1 = idx1 % this.boardSize;
        const r2 = Math.floor(idx2 / this.boardSize);
        const c2 = idx2 % this.boardSize;

        return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
    }

    checkWin() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) return;
        }

        // Win!
        this.gameWon();
    }

    gameWon() {
        this.isPlaying = false;
        this.stopTimer();

        this.finalTimeEl.textContent = this.timerEl.textContent;
        this.finalMovesEl.textContent = this.moves;

        setTimeout(() => {
            this.winModal.classList.remove('hidden');
        }, 300);
    }

    closeModal() {
        this.winModal.classList.add('hidden');
        this.startNewGame();
    }

    renderBoard() {
        this.boardEl.innerHTML = '';

        // Toggle seamless mode class
        if (this.currentImage) {
            this.boardEl.classList.add('image-active');
        } else {
            this.boardEl.classList.remove('image-active');
        }

        this.tiles.forEach((value, index) => {
            const tile = document.createElement('div');
            tile.className = `tile ${value === 0 ? 'empty' : ''}`;

            if (value !== 0) {
                // If we have an image, apply it
                if (this.currentImage) {
                    tile.classList.add('image-mode');
                    tile.style.backgroundImage = `url(${this.currentImage})`;
                    tile.style.backgroundSize = `${this.boardSize * 100}%`;

                    // Calculate position based on the value (correct position of the tile)
                    // The value 1 is at 0,0. value 2 is at 0,1 etc.
                    // We need 0-based index of the original position
                    const originalRow = Math.floor((value - 1) / this.boardSize);
                    const originalCol = (value - 1) % this.boardSize;

                    const percentX = (originalCol * (100 / (this.boardSize - 1)));
                    const percentY = (originalRow * (100 / (this.boardSize - 1)));

                    tile.style.backgroundPosition = `${percentX}% ${percentY}%`;
                } else {
                    tile.textContent = value;
                }

                // Add correct position hint style purely for visual flair
                if (value === index + 1 && !this.currentImage) {
                    tile.classList.add('correct-pos'); // Optional: don't show green when image is active?
                } else if (value === index + 1 && this.currentImage) {
                    // Maybe just a subtle border for image mode? 
                    // Let's keep it clean for now.
                }

                tile.addEventListener('click', () => this.handleTileClick(index));
            } else if (this.currentImage) {
                // Empty tile in image mode
                tile.classList.add('image-mode');
            }

            this.boardEl.appendChild(tile);
        });
    }
}

// Start the game when content loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new TiliToli();
});
