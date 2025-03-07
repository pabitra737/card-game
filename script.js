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

// Game configuration
const config = {
    easy: { pairs: 8, cols: 4 },
    medium: { pairs: 18, cols: 6 },
    hard: { pairs: 32, cols: 8 }
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
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
    
    if (pageId === 'gamePage') {
        initializeGame();
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
    moveCount = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameStarted = false;
    
    updateStats();
    createGameBoard();
}

function createGameBoard() {
    const gameBoard = document.querySelector('.game-board');
    const { pairs, cols } = config[difficulty];
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    // Create card content
    let content = gameContent[gameType].slice(0, pairs);
    content = [...content, ...content];
    content.sort(() => Math.random() - 0.5);
    
    // Clear existing board
    gameBoard.innerHTML = '';
    
    // Create cards
    content.forEach((value, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.value = value;
        
        const front = document.createElement('div');
        front.className = 'card-front';
        
        const back = document.createElement('div');
        back.className = 'card-back';
        back.innerHTML = '❓';
        
        // Set content based on game type
        if (gameType === 'colors') {
            front.classList.add('color-card');
            front.style.backgroundColor = value;
            
            // Add color swatch container
            const colorSwatch = document.createElement('div');
            colorSwatch.style.width = '100%';
            colorSwatch.style.height = '100%';
            colorSwatch.style.backgroundColor = value;
            colorSwatch.style.borderRadius = 'inherit';
            front.appendChild(colorSwatch);
        } else {
            const contentSpan = document.createElement('span');
            contentSpan.textContent = value;
            contentSpan.style.pointerEvents = 'none';
            front.appendChild(contentSpan);
        }
        
        card.appendChild(back);
        card.appendChild(front);
        
        // Add click event
        card.addEventListener('click', () => handleCardClick(card));
        
        gameBoard.appendChild(card);
    });
    
    cards = Array.from(document.querySelectorAll('.card'));
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
        const color1 = card1.querySelector('.color-card').style.backgroundColor;
        const color2 = card2.querySelector('.color-card').style.backgroundColor;
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
}

// Victory Handling
function handleVictory() {
    const isHighScore = moveCount < (highScores[gameType][difficulty] || Infinity);
    if (isHighScore) {
        highScores[gameType][difficulty] = moveCount;
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }
    showVictoryPage(moveCount, isHighScore);
}

function showVictoryPage(moves, isHighScore) {
    document.getElementById('finalMoves').textContent = moves;
    document.getElementById('victoryHighScore').textContent = 
        isHighScore ? '🏆 New High Score!' : `High Score: ${highScores[gameType][difficulty]}`;
    
    showPage('victoryPage');
    
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
    document.querySelectorAll('.game-type').forEach(btn => {
        btn.addEventListener('click', () => {
            setGameType(btn.dataset.type);
            // Update active state visually
            document.querySelectorAll('.game-type').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Initialize difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setDifficulty(btn.dataset.difficulty);
            // Update active state visually
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Start button
    document.getElementById('startBtn').addEventListener('click', () => {
        showPage('selectionPage');
    });
    
    // Play button
    document.getElementById('playBtn').addEventListener('click', () => {
        showPage('gamePage');
    });
    
    // Reset and menu buttons
    document.getElementById('resetBtn').addEventListener('click', () => {
        playSound('button');
        initializeGame();
    });
    
    document.getElementById('menuBtn').addEventListener('click', () => {
        playSound('button');
        showPage('welcomePage');
    });
    
    // Victory page buttons
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        showPage('gamePage');
    });
    
    document.getElementById('newGameBtn').addEventListener('click', () => {
        showPage('selectionPage');
    });
    
    // Initialize touch events
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.card')) {
            e.preventDefault(); // Prevent double-tap zoom
        }
    }, { passive: false });
    
    // Show welcome page initially
    showPage('welcomePage');
});