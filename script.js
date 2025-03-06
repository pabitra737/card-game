// Audio Context
let audioContext = null;

// Initialize sound system
function initializeSounds() {
    // Initialize audio context on first user interaction
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Add click sounds to buttons
    if (resetButton) {
        resetButton.removeEventListener('click', createButtonClickSound);
        resetButton.addEventListener('click', createButtonClickSound);
    }
    
    gameTypeButtons.forEach(btn => {
        btn.removeEventListener('click', createButtonClickSound);
        btn.addEventListener('click', createButtonClickSound);
    });
    
    difficultyButtons.forEach(btn => {
        btn.removeEventListener('click', createButtonClickSound);
        btn.addEventListener('click', createButtonClickSound);
    });
}

// Initialize touch events
function initializeTouchEvents() {
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.card')) {
            e.preventDefault(); // Prevent double-tap zoom
        }
    }, { passive: false });
}

// Play sound utility function
function playSound(soundName) {
    try {
        switch(soundName) {
            case 'flip':
                createTapSound();
                break;
            case 'match':
                createMatchSound();
                break;
            case 'victory':
                createVictoryMusic();
                break;
            case 'gameOver':
                createGameOverMusic();
                break;
            case 'button':
                createButtonClickSound();
                break;
        }
    } catch (error) {
        console.log('Sound play failed:', error);
    }
}

const NOTES = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.00,
    B5: 987.77,
    C6: 1046.50
};

function createSound(frequency, duration, type = 'triangle', volume = 0.15, startTime = 0) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
    
    // Softer envelope with gentle attack and release
    gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + duration - 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);
    
    oscillator.start(audioContext.currentTime + startTime);
    oscillator.stop(audioContext.currentTime + startTime + duration);
}

function createTapSound() {
    // Soft bell-like tap sound
    createSound(NOTES.E5, 0.1, 'triangle', 0.15);
}

function createMatchSound() {
    // Gentle wind chime sound
    createSound(NOTES.C5, 0.15, 'triangle', 0.15);
    setTimeout(() => createSound(NOTES.E5, 0.15, 'triangle', 0.15), 100);
    setTimeout(() => createSound(NOTES.G5, 0.2, 'triangle', 0.15), 200);
}

function createVictoryMusic() {
    // Gentle music box melody
    const sequence = [
        { note: NOTES.C5, time: 0.0, duration: 0.2, type: 'triangle' },
        { note: NOTES.E5, time: 0.2, duration: 0.2, type: 'triangle' },
        { note: NOTES.G5, time: 0.4, duration: 0.2, type: 'triangle' },
        { note: NOTES.C6, time: 0.6, duration: 0.3, type: 'triangle' },
        // Soft ending chord
        { note: NOTES.C5, time: 1.0, duration: 0.8, type: 'triangle' },
        { note: NOTES.E5, time: 1.0, duration: 0.8, type: 'triangle' },
        { note: NOTES.G5, time: 1.0, duration: 0.8, type: 'triangle' }
    ];
    
    sequence.forEach(note => {
        createSound(note.note, note.duration, note.type, 0.12, note.time);
    });
}

function createGameOverMusic() {
    // Soft music box ending
    const sequence = [
        { note: NOTES.E5, time: 0.0, duration: 0.2, type: 'triangle' },
        { note: NOTES.C5, time: 0.2, duration: 0.2, type: 'triangle' },
        { note: NOTES.G4, time: 0.4, duration: 0.2, type: 'triangle' },
        // Gentle minor chord
        { note: NOTES.C5, time: 0.7, duration: 0.6, type: 'triangle' },
        { note: NOTES.E4, time: 0.7, duration: 0.6, type: 'triangle' },
        { note: NOTES.G4, time: 0.7, duration: 0.6, type: 'triangle' }
    ];
    
    sequence.forEach(note => {
        createSound(note.note, note.duration, note.type, 0.12, note.time);
    });
}

function createButtonClickSound() {
    // Soft click sound
    createSound(NOTES.G5, 0.08, 'triangle', 0.1);
}

// Game state
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let moveLimit = 30;
let gameStarted = false;
let highScore = localStorage.getItem('highScore') || '-';
let currentGameType = 'emoji';
let currentSize = 8;

// Game symbols for different types
const gameSymbols = {
    emoji: ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎟️', '🎬', '🎸', '🎺', '🎨', '🎭', '🎪', '🎟️', '🎬', '🎮'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
};

// Game type descriptions
const gameTypeDesc = {
    emoji: 'Match the emoji pairs',
    numbers: 'Match the number pairs',
    letters: 'Match the letter pairs'
};

// Move limits for different game types and difficulties
const moveLimits = {
    emoji: {
        8: 20,    // Easy
        12: 35,   // Medium
        16: 50    // Hard
    },
    numbers: {
        8: 15,    // Easy
        12: 30,   // Medium
        16: 45    // Hard
    },
    letters: {
        8: 18,    // Easy
        12: 32,   // Medium
        16: 48    // Hard
    }
};

// DOM elements
const gameBoard = document.getElementById('gameBoard');
const moveCount = document.getElementById('moveCount');
const highScoreDisplay = document.getElementById('highScore');
const resetButton = document.getElementById('resetButton');
const gameTypeButtons = document.querySelectorAll('.game-type');
const difficultyButtons = document.querySelectorAll('.diff-btn');

// Initialize game function
function initializeGame() {
    // Initialize sounds if not already done
    initializeSounds();
    
    // Reset game state
    cards = [];
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    gameStarted = false;
    moveCount.style.color = 'white';
    updateStats();
    gameBoard.innerHTML = '';

    // Update high score display for current game type and size
    const scoreKey = `highScore_${currentGameType}_${currentSize}`;
    highScore = localStorage.getItem(scoreKey) || '-';
    highScoreDisplay.textContent = highScore;

    // Get symbols for current game type and size
    const symbols = gameSymbols[currentGameType].slice(0, currentSize);
    const cardPairs = [...symbols, ...symbols];
    
    // Shuffle cards
    for (let i = cardPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    // Update game board layout
    updateGridLayout();

    // Create card elements
    cardPairs.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-front">${symbol}</div>
            <div class="card-back"></div>
        `;
        card.dataset.symbol = symbol;
        card.dataset.index = index;
        card.addEventListener('click', handleCardClick);
        card.addEventListener('touchstart', handleCardClick, { passive: false });
        gameBoard.appendChild(card);
        cards.push(card);
    });

    // Show game type info
    const gameInfo = `${gameTypeDesc[currentGameType]} - ${moveLimit} moves limit`;
    alert(gameInfo);
}

// Update grid layout based on card count
function updateGridLayout() {
    const isMobile = window.innerWidth <= 600;
    
    // Remove existing difficulty classes
    gameBoard.classList.remove('medium', 'hard');
    
    // Add appropriate difficulty class
    if (currentSize > 8) {
        if (currentSize <= 12) {
            gameBoard.classList.add('medium');
        } else {
            gameBoard.classList.add('hard');
        }
    }
    
    if (isMobile) {
        gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else {
        if (currentSize <= 8) {
            gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
        } else if (currentSize <= 12) {
            gameBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
        } else {
            gameBoard.style.gridTemplateColumns = 'repeat(8, 1fr)';
        }
    }
}

// Update stats display
function updateStats() {
    moveCount.textContent = `${moves}/${moveLimit}`;
    if (moves >= moveLimit - 5) {
        moveCount.style.color = '#FF6B6B';
    }
}

// Update move limit based on game type and difficulty
function updateMoveLimit() {
    moveLimit = moveLimits[currentGameType][currentSize];
    updateStats();
}

// Handle game type selection
function handleGameTypeChange(e) {
    const button = e.target;
    gameTypeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentGameType = button.dataset.type;
    updateMoveLimit();
    initializeGame();
}

// Handle difficulty selection
function handleDifficultyChange(e) {
    const button = e.target;
    difficultyButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentSize = parseInt(button.dataset.size);
    updateMoveLimit();
    initializeGame();
}

// Add event listeners
gameTypeButtons.forEach(button => {
    button.addEventListener('click', handleGameTypeChange);
});

difficultyButtons.forEach(button => {
    button.addEventListener('click', handleDifficultyChange);
});

// Initialize touch events
initializeTouchEvents();

// Start game
initializeGame();

// Add window resize listener
window.addEventListener('resize', updateGridLayout);

// Handle card click
function handleCardClick(e) {
    const card = e.currentTarget;
    
    // Prevent clicking if card is already flipped, matched, or moves exceeded
    if (card.classList.contains('flipped') || 
        card.classList.contains('matched') || 
        flippedCards.length >= 2 ||
        moves >= moveLimit) {
        return;
    }

    // Start game if first move
    if (!gameStarted) {
        gameStarted = true;
    }

    // Flip card
    flipCard(card);

    // Check for match
    if (flippedCards.length === 2) {
        moves++;
        updateStats();
        checkMatch();
        
        // Check if moves limit reached
        if (moves >= moveLimit && matchedPairs < currentSize) {
            setTimeout(() => {
                playSound('gameOver');
                alert(`Game Over! You've reached the move limit (${moveLimit}). Try again!`);
                initializeGame();
            }, 500);
        }
    }
}

// Flip card animation
function flipCard(card) {
    card.classList.add('flipped');
    flippedCards.push(card);
    playSound('flip');
}

// Check if flipped cards match
function checkMatch() {
    const [card1, card2] = flippedCards;
    const match = card1.dataset.symbol === card2.dataset.symbol;

    if (match) {
        matchedPairs++;
        const symbolIndex = parseInt(card1.dataset.index) % currentSize;
        const pairColor = pairColors[symbolIndex];
        
        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.style.background = pairColor;
        card2.style.background = pairColor;
        card1.querySelector('.card-front').style.background = pairColor;
        card2.querySelector('.card-front').style.background = pairColor;
        
        playSound('match');
        
        if (matchedPairs === currentSize) {
            setTimeout(() => {
                playSound('victory');
                const isNewHighScore = updateHighScore();
                const message = isNewHighScore 
                    ? `🎉 New High Score! You won in ${moves} moves!` 
                    : `Congratulations! You won in ${moves} moves!`;
                alert(message);
                initializeGame();
            }, 500);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }, 1000);
    }

    flippedCards = [];
}

// Update high score
function updateHighScore() {
    const scoreKey = `highScore_${currentGameType}_${currentSize}`;
    const currentHighScore = localStorage.getItem(scoreKey) || '-';
    
    if (currentHighScore === '-' || moves < parseInt(currentHighScore)) {
        localStorage.setItem(scoreKey, moves.toString());
        highScoreDisplay.textContent = moves;
        return true;
    }
    return false;
}

// Card colors for matched pairs
const pairColors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Light Blue
    '#96CEB4', // Mint
    '#FFEEAD', // Light Yellow
    '#D4A5A5', // Dusty Rose
    '#9B59B6', // Purple
    '#3498DB',  // Blue
    '#E74C3C', // Bright Red
    '#F1C40F', // Yellow
    '#2ECC71', // Green
    '#E67E22', // Orange
    '#1ABC9C', // Turquoise
    '#9B59B6', // Purple
    '#34495E', // Navy Blue
    '#16A085'  // Sea Green
];