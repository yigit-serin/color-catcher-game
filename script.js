class ColorGame {
    constructor() {
        this.score = 0;
        this.timeLeft = 60;
        this.gameInterval = null;
        this.colorChangeInterval = null;
        this.isGameActive = false;
        this.targetColor = null;
        this.gridSize = 4;
        this.initialColorChangeTime = 5; // Başlangıç renk değişim süresi
        this.minColorChangeTime = 1.5; // Minimum renk değişim süresi
        this.colorChangeTimeDecrease = 0.5; // Her seviyede azalma miktarı
        this.initialTimeBonus = 3; // Başlangıç bonus süresi
        this.timePenalty = 3;
        this.colorChangeTime = this.initialColorChangeTime;
        this.timeBonus = this.initialTimeBonus;
        this.nextColorChange = this.colorChangeTime;
        this.milliseconds = 0;
        this.colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
            '#FF00FF', '#00FFFF', '#FFA500', '#800080',
            '#008000', '#FFC0CB', '#A52A2A', '#808080'
        ];
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.endScreen = document.getElementById('end-screen');
        this.startButton = document.getElementById('start-button');
        this.playAgainButton = document.getElementById('play-again');
        this.gridContainer = document.getElementById('grid');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.targetColorElement = document.getElementById('target-color');
        this.finalScoreElement = document.getElementById('final-score');
        this.nextChangeElement = document.getElementById('next-change');
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.playAgainButton.addEventListener('click', () => this.startGame());
    }

    startGame() {
        this.score = 0;
        this.timeLeft = 60;
        this.nextColorChange = this.initialColorChangeTime;
        this.colorChangeTime = this.initialColorChangeTime;
        this.timeBonus = this.initialTimeBonus;
        this.milliseconds = 0;
        this.isGameActive = true;
        
        this.showScreen('game');
        this.updateScore();
        this.updateTimer();
        this.updateNextChange();
        this.createGrid();
        this.startGameLoop();
    }

    showScreen(screenName) {
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.endScreen.classList.add('hidden');

        switch(screenName) {
            case 'start':
                this.startScreen.classList.remove('hidden');
                break;
            case 'game':
                this.gameScreen.classList.remove('hidden');
                break;
            case 'end':
                this.endScreen.classList.remove('hidden');
                break;
        }
    }

    createGrid() {
        this.gridContainer.innerHTML = '';
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const box = document.createElement('div');
            box.classList.add('color-box');
            box.addEventListener('click', () => this.handleBoxClick(box));
            this.gridContainer.appendChild(box);
        }
        this.updateColors();
    }

    updateColors() {
        const boxes = document.querySelectorAll('.color-box');
        const availableColors = [...this.colors];
        
        // Rastgele hedef renk seç
        if (!this.targetColor) {
            const randomIndex = Math.floor(Math.random() * availableColors.length);
            this.targetColor = availableColors[randomIndex];
            this.targetColorElement.style.backgroundColor = this.targetColor;
            // Seçilen rengi listeden çıkar
            availableColors.splice(randomIndex, 1);
        }

        // Hedef rengin konumunu rastgele seç
        const targetColorPosition = Math.floor(Math.random() * boxes.length);
        
        // Tüm kutulara renk ata
        boxes.forEach((box, index) => {
            if (index === targetColorPosition) {
                // Hedef rengi yerleştir
                box.style.backgroundColor = this.targetColor;
            } else {
                // Rastgele başka bir renk seç
                if (availableColors.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableColors.length);
                    const color = availableColors[randomIndex];
                    box.style.backgroundColor = color;
                    availableColors.splice(randomIndex, 1);
                } else {
                    // Eğer renk kalmadıysa, orijinal listeden yeni bir renk seç
                    const randomIndex = Math.floor(Math.random() * this.colors.length);
                    const color = this.colors[randomIndex];
                    // Hedef renkten farklı olduğundan emin ol
                    if (color === this.targetColor) {
                        box.style.backgroundColor = this.colors[(randomIndex + 1) % this.colors.length];
                    } else {
                        box.style.backgroundColor = color;
                    }
                }
            }
        });
    }

    handleBoxClick(box) {
        if (!this.isGameActive) return;

        const clickedColor = box.style.backgroundColor;
        const targetRgb = this.hexToRgb(this.targetColor);
        const targetRgbString = `rgb(${targetRgb.r}, ${targetRgb.g}, ${targetRgb.b})`;

        if (clickedColor === targetRgbString) {
            const oldScore = this.score;
            this.score += 10;
            this.showScoreGain(10);
            
            // Her 100 puanda süreleri güncelle
            if (this.score % 100 === 0 && this.score > 0) {
                const level = Math.floor(this.score / 100);
                
                // Yeni renk süresini güncelle (5'ten başla, her 100 puanda 0.5 azalt, minimum 1.5)
                const newColorChangeTime = Math.max(
                    this.minColorChangeTime, 
                    this.initialColorChangeTime - (level * this.colorChangeTimeDecrease)
                );
                if (newColorChangeTime !== this.colorChangeTime) {
                    console.log(`Renk değişim süresi güncellendi: ${newColorChangeTime}`);
                    this.colorChangeTime = newColorChangeTime;
                }
                
                // Bonus süreyi güncelle (3'ten başla, her 100 puanda 1 azalt, minimum 1)
                const newTimeBonus = Math.max(1, this.initialTimeBonus - level);
                if (newTimeBonus !== this.timeBonus) {
                    console.log(`Bonus süre güncellendi: ${newTimeBonus}`);
                    this.timeBonus = newTimeBonus;
                }
            }
            
            this.targetColor = null;
            this.updateColors();
            this.nextColorChange = this.colorChangeTime;
            this.milliseconds = 0;
            
            this.addTimeBonus();
        } else {
            // Puan cezası
            const oldScore = this.score;
            this.score = Math.max(0, this.score - 5);
            this.showScorePenalty(oldScore - this.score);

            // Süre cezası
            this.timeLeft = Math.max(0, this.timeLeft - this.timePenalty);
            this.showTimePenalty(this.timePenalty);
            this.updateTimer();
        }
        
        this.updateScore();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    showScoreGain(amount) {
        const scoreElement = document.getElementById('score');
        const animation = document.createElement('div');
        animation.className = 'score-animation score-gain';
        animation.textContent = `+${amount}`;
        
        const rect = scoreElement.getBoundingClientRect();
        animation.style.left = `${rect.right + 10}px`;
        animation.style.top = `${rect.top}px`;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 800);
    }

    showScorePenalty(amount) {
        const scoreElement = document.getElementById('score');
        const animation = document.createElement('div');
        animation.className = 'score-animation score-penalty';
        animation.textContent = `-${amount}`;
        
        const rect = scoreElement.getBoundingClientRect();
        animation.style.left = `${rect.right + 10}px`;
        animation.style.top = `${rect.top}px`;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 800);
    }

    showTimeBonus(amount) {
        const timerElement = document.getElementById('timer');
        const animation = document.createElement('div');
        animation.className = 'time-animation time-bonus';
        animation.textContent = `+${amount}s`;
        
        const rect = timerElement.getBoundingClientRect();
        animation.style.left = `${rect.right + 10}px`;
        animation.style.top = `${rect.top}px`;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 800);
    }

    showTimePenalty(amount) {
        const timerElement = document.getElementById('timer');
        const animation = document.createElement('div');
        animation.className = 'time-animation time-penalty';
        animation.textContent = `-${amount}s`;
        
        const rect = timerElement.getBoundingClientRect();
        animation.style.left = `${rect.right + 10}px`;
        animation.style.top = `${rect.top}px`;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 800);
    }

    addTimeBonus() {
        this.timeLeft = Math.min(60, this.timeLeft + this.timeBonus);
        this.showTimeBonus(this.timeBonus);
        this.updateTimer();
    }

    startGameLoop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        if (this.colorChangeInterval) clearInterval(this.colorChangeInterval);

        // Ana oyun döngüsü (1 saniye)
        this.gameInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);

        // Milisaniye döngüsü (50ms) - daha sık güncelleme için
        this.millisecondInterval = setInterval(() => {
            if (this.isGameActive) {
                this.milliseconds = (this.milliseconds + 50) % 1000;
                this.nextColorChange = Math.max(0, this.nextColorChange - 0.05);
                this.updateNextChange();

                if (this.nextColorChange <= 0) {
                    this.targetColor = null;
                    this.updateColors();
                    this.nextColorChange = this.colorChangeTime;
                }
            }
        }, 50);
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    updateTimer() {
        this.timerElement.textContent = this.timeLeft;
    }

    updateNextChange() {
        const seconds = Math.floor(this.nextColorChange);
        const decimal = Math.floor((this.nextColorChange % 1) * 10);
        this.nextChangeElement.textContent = `${seconds}.${decimal}`;
    }

    endGame() {
        this.isGameActive = false;
        clearInterval(this.gameInterval);
        clearInterval(this.millisecondInterval);
        this.finalScoreElement.textContent = this.score;
        this.showScreen('end');
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new ColorGame();
});
