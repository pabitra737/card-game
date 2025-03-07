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

// Initialize Particles.js
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: true,
            out_mode: 'out'
        }
    }
});

// Game state
let gameType = 'numbers';
let difficulty = 'easy';
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moveCount = 0;
let gameStarted = false;
let highScores = JSON.parse(localStorage.getItem('highScores')) || {
    numbers: { easy: Infinity, medium: Infinity, hard: Infinity },
    emojis: { easy: Infinity, medium: Infinity, hard: Infinity },
    colors: { easy: Infinity, medium: Infinity, hard: Infinity }
};

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Game configuration
const config = {
    easy: { pairs: 8, cols: 4, moveLimit: 20 },
    medium: { pairs: 18, cols: 6, moveLimit: 40 },
    hard: { pairs: 32, cols: 8, moveLimit: 60 }
};

const gameContent = {
    numbers: Array.from({ length: 32 }, (_, i) => i + 1),
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄',
             '🐙', '🦋', '🦀', '🐠', '🐳', '🦕', '🦖', '🐉', '🐝', '🦩', '🦚', '🦜', '🐢', '🐍', '🦎', '🦔'],
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B9B9B', '#A8E6CF',
             '#FF8B94', '#FFD93D', '#6C5B7B', '#C06C84', '#F67280', '#355C7D', '#F8B195', '#F67280',
             '#2A363B', '#E84A5F', '#FF847C', '#FECEA8', '#99B898', '#FECEAB', '#FF847C', '#E84A5F',
             '#2A363B', '#F8B195', '#F67280', '#C06C84', '#6C5B7B', '#355C7D', '#99B898', '#FECEA8']
};

// Page Management
function showPage(pageId) {
    // Hide all pages first
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.style.opacity = '0';
    });
    
    // Show the target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'flex';
        // Use setTimeout to ensure display: flex is applied before opacity
        setTimeout(() => {
            targetPage.style.opacity = '1';
        }, 10);
        
        // Initialize game if showing game page
        if (pageId === 'gamePage') {
            initializeGame();
        }
        
        // Log for debugging
        console.log(`Showing page: ${pageId}`);
    } else {
        console.error(`Page with id ${pageId} not found`);
    }
}

// Game Type Selection
function setGameType(type) {
    gameType = type;
    document.querySelectorAll('.game-type').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
}

// Difficulty Selection
function setDifficulty(diff) {
    difficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-difficulty="${diff}"]`).classList.add('active');
}

// Game Initialization
function initializeGame() {
    // Reset game state
    moveCount = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameStarted = false;
    
    // Clear existing game board
    const gameBoard = document.querySelector('.game-board');
    if (!gameBoard) {
        console.error('Game board not found');
        return;
    }
    
    // Clear existing content
    gameBoard.innerHTML = '';
    
    // Set up the grid layout based on difficulty
    const gridSize = config[difficulty].cols;
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    
    // Create card content by duplicating and shuffling
    const cardContent = [...gameContent[gameType]];
    // Only take the number of cards needed for the current difficulty
    const neededCards = config[difficulty].pairs * 2;
    const selectedContent = cardContent.slice(0, neededCards / 2);
    const duplicatedContent = [...selectedContent, ...selectedContent];
    shuffleArray(duplicatedContent);
    
    console.log(`Creating ${neededCards} cards for ${difficulty} difficulty`);
    
    // Create cards
    duplicatedContent.forEach((content, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.value = content;
        
        // Create card back
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.innerHTML = '?';
        
        // Create card front
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        if (gameType === 'colors') {
            const colorSwatch = document.createElement('div');
            colorSwatch.className = 'color-swatch';
            colorSwatch.style.backgroundColor = content;
            cardFront.appendChild(colorSwatch);
        } else {
            const contentSpan = document.createElement('span');
            contentSpan.textContent = content;
            contentSpan.style.pointerEvents = 'none';
            cardFront.appendChild(contentSpan);
        }
        
        // Add event listeners
        card.addEventListener('click', () => handleCardClick(card));
        card.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleCardClick(card);
        }, { passive: false });
        
        // Append card faces
        card.appendChild(cardBack);
        card.appendChild(cardFront);
        gameBoard.appendChild(card);
    });
    
    // Update cards array and stats
    cards = Array.from(document.querySelectorAll('.card'));
    console.log('Cards created:', cards.length);
    updateStats();
}

// Card Click Handler
function handleCardClick(card) {
    if (!gameStarted) {
        gameStarted = true;
        updateStats();
    }

    if (
        flippedCards.length >= 2 ||
        flippedCards.includes(card) ||
        card.classList.contains('matched')
    ) {
        return;
    }

    playSound('flip');
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        moveCount++;
        updateStats();
        checkMatch();
    }
}

// Match Checking
function checkMatch() {
    const [card1, card2] = flippedCards;
    const match = isMatch(card1, card2);

    if (match) {
        handleMatch(card1, card2);
    } else {
        handleMismatch(card1, card2);
    }
}

function isMatch(card1, card2) {
    if (gameType === 'colors') {
        const color1 = card1.querySelector('.color-swatch').style.backgroundColor;
        const color2 = card2.querySelector('.color-swatch').style.backgroundColor;
        return color1 === color2;
    }
    return card1.dataset.value === card2.dataset.value;
}

function getCardValue(card) {
    return card.dataset.value;
}

function handleMatch(card1, card2) {
    playSound('match');
        card1.classList.add('matched');
        card2.classList.add('matched');
    matchedPairs++;
    flippedCards = [];
    
    if (matchedPairs === config[difficulty].pairs) {
            setTimeout(() => {
                playSound('victory');
            handleVictory();
            }, 500);
        }
}

function handleMismatch(card1, card2) {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        flippedCards = [];
        }, 1000);
    }

// Stats Update
function updateStats() {
    document.getElementById('moveCount').textContent = moveCount;
    const highScore = highScores[gameType][difficulty];
    document.getElementById('highScore').textContent = highScore === Infinity ? '-' : highScore;
    
    // Update moves remaining
    const movesLeft = config[difficulty].moveLimit - moveCount;
    document.getElementById('movesLeft').textContent = movesLeft;
    
    // Check for move limit
    if (moveCount >= config[difficulty].moveLimit) {
        handleGameOver();
    }
}

// Game Over Handling
function handleGameOver() {
    playSound('gameOver');
    showGameOverPage();
}

function showGameOverPage() {
    document.getElementById('finalMoves').textContent = moveCount;
    document.getElementById('moveLimit').textContent = config[difficulty].moveLimit;
    
    // Ensure the game over page is visible
    const gameOverPage = document.getElementById('gameOverPage');
    if (gameOverPage) {
        gameOverPage.style.display = 'flex';
        gameOverPage.style.opacity = '1';
        
        // Reset any transform styles on buttons
        const buttons = gameOverPage.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        });
    }
    
    // Trigger game over animations
    const tl = gsap.timeline();
    
    // Stats animation
    tl.from('.game-over-stats .stat-item', {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: 'back.out(1.2)'
    });
    
    // Button animation
    tl.from('.game-over-buttons button', {
        scale: 0,
        opacity: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: 'back.out(1.2)'
    }, '-=0.3');
}

// Victory Handling
function handleVictory() {
    const isHighScore = moveCount < (highScores[gameType][difficulty] || Infinity);
    if (isHighScore) {
        highScores[gameType][difficulty] = moveCount;
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }
    console.log('Victory! Moves:', moveCount); // Debug log
    showVictoryPage(moveCount, isHighScore);
}

function showVictoryPage(moves, isHighScore) {
    // Update the moves display
    const finalMovesElement = document.getElementById('finalMoves');
    if (finalMovesElement) {
        finalMovesElement.textContent = moves;
    }
    
    // Update high score display
    const victoryHighScoreElement = document.getElementById('victoryHighScore');
    if (victoryHighScoreElement) {
        victoryHighScoreElement.textContent = isHighScore ? '🏆 New High Score!' : `High Score: ${highScores[gameType][difficulty]}`;
    }
    
    // Ensure the victory page is visible
    const victoryPage = document.getElementById('victoryPage');
    if (victoryPage) {
        victoryPage.style.display = 'flex';
        victoryPage.style.opacity = '1';
        
        // Reset any transform styles on buttons
        const buttons = victoryPage.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        });
    }
    
    // Trigger celebration animations
    const tl = gsap.timeline();
    
    // Trophy animation
    tl.from('.trophy', {
        scale: 0,
        rotation: 720,
        duration: 1,
        ease: 'back.out(1.7)'
    });
    
    // Stats animation
    tl.from('.victory-stats .stat-item', {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: 'back.out(1.2)'
    }, '-=0.5');
    
    // Button animation
    tl.from('.victory-buttons button', {
        scale: 0,
        opacity: 0,
        stagger: 0.2,
        duration: 0.5,
        ease: 'back.out(1.2)'
    }, '-=0.3');
    
    // Confetti effect
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game type buttons
    const gameTypeButtons = document.querySelectorAll('.game-type');
    const difficultyButtons = document.querySelectorAll('.diff-btn');
    
    gameTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setGameType(btn.dataset.type);
            // Update active state visually
            gameTypeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            console.log('Game type set to:', btn.dataset.type);
        });
    });
    
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setDifficulty(btn.dataset.difficulty);
            // Update active state visually
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            console.log('Difficulty set to:', btn.dataset.difficulty);
        });
    });
    
    // Start button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('Start button clicked');
            showPage('selectionPage');
        });
    } else {
        console.error('Start button not found');
    }
    
    // Play button
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            console.log('Play button clicked');
            showPage('gamePage');
        });
    } else {
        console.error('Play button not found');
    }
    
    // Reset and menu buttons
    const resetBtn = document.getElementById('resetBtn');
    const menuBtn = document.getElementById('menuBtn');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            playSound('button');
            initializeGame();
        });
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            playSound('button');
            showPage('welcomePage');
        });
    }
    
    // Game Over page buttons
    const retryBtn = document.getElementById('retryBtn');
    const gameOverMenuBtn = document.getElementById('gameOverMenuBtn');
    
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            playSound('button');
            initializeGame();
            showPage('gamePage');
        });
    }
    
    if (gameOverMenuBtn) {
        gameOverMenuBtn.addEventListener('click', () => {
            playSound('button');
            showPage('welcomePage');
        });
    }
    
    // Victory page buttons
    const playAgainBtn = document.getElementById('playAgainBtn');
    const newGameBtn = document.getElementById('newGameBtn');
    const victoryMenuBtn = document.getElementById('victoryMenuBtn');
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            playSound('button');
            initializeGame();
            showPage('gamePage');
        });
    }
    
    if (newGameBtn) {
        newGameBtn.addEventListener('click', () => {
            playSound('button');
            showPage('selectionPage');
        });
    }
    
    if (victoryMenuBtn) {
        victoryMenuBtn.addEventListener('click', () => {
            playSound('button');
            showPage('welcomePage');
        });
    }
    
    // Initialize touch events
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.card')) {
            e.preventDefault(); // Prevent double-tap zoom
        }
    }, { passive: false });
    
    // Show welcome page initially
    showPage('welcomePage');
});