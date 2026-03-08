// Game State
const state = {
    currentLevel: 1,
    sequenceLength: 4, // Initial length set to 4 as requested
    sequence: '',
    userInput: '',
    highScore: localStorage.getItem('brainTrainerHighScore') || 0,
    timer: null,
    timeAllocated: 0
};

// DOM References
const screens = {
    start: document.getElementById('screen-start'),
    memorize: document.getElementById('screen-memorize'),
    input: document.getElementById('screen-input'),
    result: document.getElementById('screen-result')
};

const els = {
    btnHome: document.getElementById('btn-home'),
    startLevelInput: document.getElementById('start-level'),
    btnDecLevel: document.getElementById('btn-dec-level'),
    btnIncLevel: document.getElementById('btn-inc-level'),
    highScore: document.getElementById('high-score'),
    levelDisplays: document.querySelectorAll('.current-level-display'),
    numberSequence: document.getElementById('number-sequence'),
    memorizeProgress: document.getElementById('memorize-progress'),
    userInputDisplay: document.getElementById('user-input-display'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    resUserInput: document.getElementById('res-user-input'),
    resCorrectInput: document.getElementById('res-correct-input'),
    resultMessage: document.getElementById('result-message'),
    btnStart: document.getElementById('btn-start'),
    btnNext: document.getElementById('btn-next'),
    btnRestart: document.getElementById('btn-restart'),
    resultCard: document.getElementById('result-card'),
    numpadKeys: document.querySelectorAll('.num-key')
};

// Initialize App
function init() {
    updateHighScore();

    // Bind Events
    els.btnStart.addEventListener('click', () => startNewGame());
    els.btnNext.addEventListener('click', () => startLevel());
    els.btnRestart.addEventListener('click', () => startNewGame());

    els.btnHome.addEventListener('click', goHome);

    els.btnDecLevel.addEventListener('click', () => {
        let val = parseInt(els.startLevelInput.value) || 1;
        if (val > 1) els.startLevelInput.value = val - 1;
    });

    els.btnIncLevel.addEventListener('click', () => {
        let val = parseInt(els.startLevelInput.value) || 1;
        els.startLevelInput.value = val + 1;
    });

    els.numpadKeys.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = btn.dataset.key;
            handleInput(key);
            triggerHaptic();
        });
    });

    document.addEventListener('keydown', handleKeyboard);
}

function triggerHaptic() {
    if (navigator.vibrate) {
        navigator.vibrate(40);
    }
}

function handleKeyboard(e) {
    if (!screens.input.classList.contains('active')) return;

    if (/[0-9]/.test(e.key)) {
        handleInput(e.key);
        animateKeyBtn(e.key);
    } else if (e.key === 'Backspace') {
        handleInput('Backspace');
        animateKeyBtn('Backspace');
    } else if (e.key === 'Enter') {
        handleInput('Enter');
        animateKeyBtn('Enter');
    }
}

function animateKeyBtn(key) {
    const btn = document.querySelector(`.num-key[data-key="${key}"]`);
    if (btn) {
        btn.style.transform = 'scale(0.92)';
        btn.style.background = 'var(--surface-hover)';
        setTimeout(() => {
            btn.style.transform = '';
            btn.style.background = '';
        }, 100);
    }
}

function updateHighScore() {
    els.highScore.textContent = state.highScore;
}

function checkHighScore() {
    if (state.currentLevel > state.highScore) {
        state.highScore = state.currentLevel - 1; // It reached currentLevel but failed, so highest passed is currentLevel-1. Actually, let's track max level REACHED?

        // Wait, if they beat level 1, currentLevel becomes 2. Their score is 1.
        // Let's store "Máximo Nível Atingido" (Max Level Reached) which is currentLevel.
        state.highScore = state.currentLevel;
        localStorage.setItem('brainTrainerHighScore', state.highScore);
        updateHighScore();
    }
}

function switchScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
        setTimeout(() => {
            if (!screens[key].classList.contains('active')) {
                screens[key].classList.add('hide');
            }
        }, 400);
    });

    setTimeout(() => {
        screens[screenName].classList.remove('hide');
        setTimeout(() => {
            screens[screenName].classList.add('active');
        }, 50);
    }, 400);
}

function startNewGame() {
    let startingLevel = parseInt(els.startLevelInput.value) || 1;
    if (startingLevel < 1) startingLevel = 1;

    state.currentLevel = startingLevel;
    state.sequenceLength = startingLevel + 3;
    startLevel();
}

function goHome() {
    clearTimeout(state.timer);
    els.memorizeProgress.style.transition = 'none';
    els.memorizeProgress.style.transform = 'scaleX(0)';
    switchScreen('start');
}

function startLevel() {
    state.sequence = generateSequence(state.sequenceLength);
    state.userInput = '';

    els.levelDisplays.forEach(el => el.textContent = state.currentLevel);
    els.numberSequence.textContent = state.sequence;

    switchScreen('memorize');

    // Time formula: 2s base + 0.6s per digit.
    state.timeAllocated = 2000 + (state.sequenceLength * 600);

    els.memorizeProgress.style.transform = 'scaleX(1)';
    els.memorizeProgress.style.transition = `transform ${state.timeAllocated}ms linear`;

    clearTimeout(state.timer);

    // Small delay to allow CSS to reset smoothly
    setTimeout(() => {
        els.memorizeProgress.style.transform = 'scaleX(0)';
    }, 50);

    state.timer = setTimeout(() => {
        els.numberSequence.textContent = '???';
        goToInput();
    }, state.timeAllocated);
}

function generateSequence(length) {
    let seq = '';
    for (let i = 0; i < length; i++) {
        seq += Math.floor(Math.random() * 10);
    }
    return seq;
}

function goToInput() {
    els.userInputDisplay.textContent = '';
    els.userInputDisplay.classList.add('focus');
    switchScreen('input');
}

function handleInput(key) {
    if (key === 'Backspace') {
        state.userInput = state.userInput.slice(0, -1);
    } else if (key === 'Enter') {
        if (state.userInput.length > 0) {
            checkResult();
        }
    } else if (state.userInput.length < state.sequenceLength + 2) {
        state.userInput += key;
    }

    els.userInputDisplay.textContent = state.userInput;

    // Auto-submit only when strictly matching length
    if (state.userInput.length === state.sequenceLength) {
        setTimeout(() => {
            if (state.userInput.length === state.sequenceLength && screens.input.classList.contains('active')) {
                checkResult();
            }
        }, 200);
    }
}

function checkResult() {
    const isCorrect = state.userInput === state.sequence;

    els.resUserInput.textContent = state.userInput || 'Em branco';
    els.resCorrectInput.textContent = state.sequence;

    if (isCorrect) {
        state.currentLevel++;
        state.sequenceLength++;
        checkHighScore();

        els.resultIcon.textContent = '🔥';
        els.resultTitle.textContent = 'Nível Concluído!';
        els.resUserInput.className = 'value user-value correct-value';
        els.resultMessage.textContent = 'Memória impecável. Prepare-se para o próximo nível.';

        els.btnNext.classList.remove('hide');
        els.btnRestart.classList.add('hide');
    } else {
        checkHighScore(); // check score before game over

        els.resultIcon.textContent = '☠️';
        els.resultTitle.textContent = 'Fim de Jogo';
        els.resUserInput.className = 'value user-value wrong';
        els.resultMessage.textContent = `Você chegou até o nível ${state.currentLevel}. Pratique diariamente para ir mais longe!`;

        els.btnNext.classList.add('hide');
        els.btnRestart.classList.remove('hide');

        els.resultCard.classList.remove('shake');
        void els.resultCard.offsetWidth; // trigger reflow
        els.resultCard.classList.add('shake');
    }

    switchScreen('result');
}

// Start
init();
