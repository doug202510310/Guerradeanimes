// js/game.js

import { Card, allCards, igrisCardData, magoNegroCardData } from './card.js';
import { shuffleArray, sleep } from './utils.js'; 

// Game State Variables (consolidadas no objeto 'game')
const players = {
    player1: { name: 'Jogador 1', team: [], currentHp: {}, draftedCards: [], selectedCards: 0, defeatedCards: [] },
    player2: { name: 'Jogador 2', team: [], currentHp: {}, draftedCards: [], selectedCards: 0, defeatedCards: [] }
};

const MAX_CARDS_PER_PLAYER = 5;
const BATTLEFIELD_POSITIONS = ['pos1', 'pos2', 'pos3', 'pos4', 'pos5']; // Frente: pos1, pos2; Trás: pos3, pos4, pos5
const PLAYER_1_POSITIONS = ['p1_pos1', 'p1_pos2', 'p1_pos3', 'p1_pos4', 'p1_pos5'];
const PLAYER_2_POSITIONS = ['p2_pos1', 'p2_pos2', 'p2_pos3', 'p2_pos4', 'p2_pos5'];

// --- Objeto Principal do Jogo ---
export const game = {
    currentPhase: 'mainMenu', // mainMenu, playerSetup, draft, battlefield, gameOver
    players: players, // Referencia o objeto players definido acima
    availableCards: [], // Cartas disponíveis para draft (instâncias de Card)
    draftOrder: [], // Ordem dos jogadores no draft
    currentPlayerId: '', // 'player1' ou 'player2'
    firstPlayerInBattle: '', // Quem começa a batalha
    selectedAttacker: null, // Instância de Card
    selectedTarget: null, // Instância de Card
    gameLog: [], // Array de mensagens do log
    battleTurn: 0, // Contador de turnos da batalha
    isProcessingAttack: false, // Flag para efeitos durante o ataque
    isProcessingHeal: false, // Flag para efeitos durante a cura
    currentDamageDealt: 0, // Armazena o último dano causado para efeitos de 'roubo de vida'
    attackCountForPlayer: { 'player1': 0, 'player2': 0 }, // Para efeito do Blastoise
    isTojiSecondHit: false, // Flag para controlar o segundo hit do Toji
    isCardDefeated: false, // Flag para efeitos on-death

    // --- Elementos DOM (inicializados no init) ---
    mainMenuElem: null,
    playerSetupElem: null,
    draftPhaseElem: null,
    battlePhaseElem: null,
    gameOverScreenElem: null,
    cardDetailModalElem: null,

    startButton: null,
    player1NameInput: null,
    player2NameInput: null,
    startDraftButton: null,
    draftTurnTextElem: null,
    availableTanksContainer: null,
    availableDamageContainer: null,
    availableHealersContainer: null,
    player1DraftCardsDiv: null,
    player2DraftCardsDiv: null,
    startBattleButton: null,
    battleTurnTextElem: null,
    player1BattleNameElem: null,
    player2BattleNameElem: null,
    player1BattlefieldContainerElem: null,
    player2BattlefieldContainerElem: null,
    attackButton: null,
    healButton: null,
    forfeitButton: null,
    gameLogDiv: null,
    victoryMessageElem: null,
    resetGameButton: null,
    modalCardImageElem: null,
    modalCardNameElem: null,
    modalCardClassElem: null,
    modalCardStatsElem: null,
    modalCardElementElem: null,
    modalCardEffectElem: null,

    // --- Objetos de Som (inicializados no init) ---
    backgroundMusic: null,
    draftSound: null,
    attackSound: null,
    healSound: null,
    turnTransitionSound: null,

    // --- Métodos do Jogo ---
    init: function() {
        // Atribui elementos DOM às propriedades do objeto game
        this.mainMenuElem = document.getElementById('mainMenu');
        this.playerSetupElem = document.getElementById('playerSetup');
        this.draftPhaseElem = document.getElementById('draftPhase');
        this.battlePhaseElem = document.getElementById('battlePhase');
        this.gameOverScreenElem = document.getElementById('gameOverScreen');
        this.cardDetailModalElem = document.getElementById('cardDetailModal');

        this.startButton = document.getElementById('startButton');
        this.player1NameInput = document.getElementById('player1Name');
        this.player2NameInput = document.getElementById('player2Name');
        this.startDraftButton = document.getElementById('startDraftButton');
        this.draftTurnTextElem = document.getElementById('draftTurnText');
        
        this.availableTanksContainer = document.getElementById('availableTanksContainer');
        this.availableDamageContainer = document.getElementById('availableDamageContainer');
        this.availableHealersContainer = document.getElementById('availableHealersContainer');
        this.availableFeiticeirosContainer = document.getElementById('availableFeiticeirosContainer');

        this.player1DraftCardsDiv = document.getElementById('player1DraftCards');
        this.player2DraftCardsDiv = document.getElementById('player2DraftCards');
        this.startBattleButton = document.getElementById('startBattleButton');

        this.battleTurnTextElem = document.getElementById('battleTurnText');
        this.player1BattleNameElem = document.getElementById('player1BattleName');
        this.player2BattleNameElem = document.getElementById('player2BattleName');
        this.player1BattlefieldContainerElem = document.getElementById('player1BattlefieldContainer');
        this.player2BattlefieldContainerElem = document.getElementById('player2BattlefieldContainer');
        
        this.attackButton = document.getElementById('attackButton');
        this.healButton = document.getElementById('healButton');
        this.forfeitButton = document.getElementById('forfeitButton');
        this.gameLogDiv = document.getElementById('gameLog');
        this.victoryMessageElem = document.getElementById('victoryMessage');
        this.resetGameButton = document.getElementById('resetGameButton');

        this.modalCardImageElem = document.getElementById('modalCardImage');
        this.modalCardNameElem = document.getElementById('modalCardName');
        this.modalCardClassElem = document.getElementById('modalCardClass');
        this.modalCardStatsElem = document.getElementById('modalCardStats');
        this.modalCardElementElem = document.getElementById('modalCardElement');
        this.modalCardEffectElem = document.getElementById('modalCardEffect');

        // Inicializa objetos de som
        // ATENÇÃO: Substitua estes URLs pelos seus arquivos de áudio reais
        this.backgroundMusic = new Audio('audio/bgm.mp3'); 
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.2; 

        this.draftSound = new Audio('audio/draft.mp3'); 
        this.draftSound.volume = 0.5;
        this.attackSound = new Audio('audio/attack.mp3'); 
        this.attackSound.volume = 0.7;
        this.healSound = new Audio('audio/heal.mp3'); 
        this.healSound.volume = 0.5;
        this.turnTransitionSound = new Audio('audio/turn_transition.mp3'); 
        this.turnTransitionSound.volume = 0.4;
        this.transformationSound = new Audio('audio/transformation.mp3'); // Você precisará criar este arquivo de áudio
        this.transformationSound.volume = 0.6;
        this.sukunaSound = new Audio('audio/Sukuna.mp3');
        this.sukunaSound.volume = 0.7;
        this.escanorSound = new Audio('audio/Escanor.mp3'); // <--- ADICIONE ESTA LINHA para Escanor
        this.escanorSound.volume = 0.7; // Ajuste o volume conforme desejar

        this.bindEventListeners();
        this.showScreen('mainMenu');

        // Torna o objeto 'game' acessível globalmente para os event listeners de cartas
        window.game = this;
    },

    bindEventListeners: function() {
        this.startButton.addEventListener('click', () => this.showScreen('playerSetup'));
        this.startDraftButton.addEventListener('click', () => this.startDraft());
        this.startBattleButton.addEventListener('click', () => this.startBattlePhase());
        this.attackButton.addEventListener('click', () => this.processAction('attack'));
        this.healButton.addEventListener('click', () => this.processAction('heal'));
        this.forfeitButton.addEventListener('click', () => this.forfeitGame());
        this.resetGameButton.addEventListener('click', () => this.resetGame());
    },

    showScreen: function(screenId) {
        this.mainMenuElem.classList.add('hidden');
        this.playerSetupElem.classList.add('hidden');
        this.draftPhaseElem.classList.add('hidden');
        this.battlePhaseElem.classList.add('hidden');
        this.gameOverScreenElem.classList.add('hidden');
        this.cardDetailModalElem.classList.add('hidden');

        document.getElementById(screenId).classList.remove('hidden');
        // AQUI: Padroniza a fase para 'battle' se for 'battlePhase'
        if (screenId === 'battlePhase') {
            this.currentPhase = 'battle'; 
        } else {
            this.currentPhase = screenId; 
        }
    },

    resetGame: function() {
        // Reinicializa jogadores e o estado do jogo completamente
        this.players.player1 = { name: 'Jogador 1', team: [], currentHp: {}, draftedCards: [], selectedCards: 0, defeatedCards: [] };
        this.players.player2 = { name: 'Jogador 2', team: [], currentHp: {}, draftedCards: [], selectedCards: 0, defeatedCards: [] };

        this.availableCards = [];
        this.draftOrder = [];
        this.currentPlayerId = '';
        this.firstPlayerInBattle = '';
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.gameLog = []; // Reseta o log do jogo
        this.battleTurn = 0;
        this.isProcessingAttack = false;
        this.isProcessingHeal = false;
        this.currentDamageDealt = 0;
        this.attackCountForPlayer = { 'player1': 0, 'player2': 0 };
        this.isTojiSecondHit = false; // Reseta para Toji
        this.isCardDefeated = false; // Reseta a flag de carta derrotada

        // Reseta elementos da UI
        this.player1NameInput.value = '';
        this.player2NameInput.value = '';
        this.player1DraftCardsDiv.innerHTML = '';
        this.player2DraftCardsDiv.innerHTML = '';
        
        this.availableTanksContainer.innerHTML = '';
        this.availableDamageContainer.innerHTML = '';
        this.availableHealersContainer.innerHTML = '';
        this.availableFeiticeirosContainer.innerHTML = '';
        
        this.gameLogDiv.innerHTML = '';
        this.startBattleButton.classList.add('hidden');
        this.attackButton.classList.add('hidden');
        this.healButton.classList.add('hidden');

        // Limpa os slots do campo de batalha
        PLAYER_1_POSITIONS.forEach(posId => { document.getElementById(posId).innerHTML = ''; });
        PLAYER_2_POSITIONS.forEach(posId => { document.getElementById(posId).innerHTML = ''; });
        this.player1BattlefieldContainerElem.classList.remove('active-player-highlight');
        this.player2BattlefieldContainerElem.classList.remove('active-player-highlight');

        this.backgroundMusic.pause(); // Para a música ao resetar
        this.backgroundMusic.currentTime = 0; // Reseta a música para o início
        this.showScreen('mainMenu'); // Volta para o menu principal
    },

    startDraft: function() {
        this.players.player1.name = this.player1NameInput.value || 'Jogador 1';
        this.players.player2.name = this.player2NameInput.value || 'Jogador 2';

        document.getElementById('player1DraftName').textContent = this.players.player1.name;
        document.getElementById('player2DraftName').textContent = this.players.player2.name;

        // Embaralha todas as cartas para o draft, criando novas instâncias para garantir estado fresco
        this.availableCards = shuffleArray(allCards.map(cardData => new Card(
            cardData.id, cardData.name, cardData.type, [cardData.attackMin, cardData.attackMax],
            cardData.maxLife, cardData.element, cardData.effectDescription, cardData.specialEffect
        )));
        this.renderAvailableCards();

        // Determina o primeiro jogador para o draft (aleatório)
        const firstDrafter = Math.random() < 0.5 ? 'player1' : 'player2';
        this.draftOrder.push(firstDrafter); 
        this.currentPlayerId = firstDrafter; 

        this.addLog(`Começando o draft! ${this.players.player1.name} e ${this.players.player2.name} vão escolher 5 cartas cada.`);
        this.updateDraftTurnText();
        this.showScreen('draftPhase');
        this.backgroundMusic.play().catch(e => console.log("Erro ao tentar tocar música:", e)); // Inicia a música de fundo
    },

   renderAvailableCards: function() {
    // Limpa todos os contêineres de categoria primeiro
    this.availableTanksContainer.innerHTML = '';
    this.availableDamageContainer.innerHTML = '';
    this.availableHealersContainer.innerHTML = '';
    this.availableFeiticeirosContainer.innerHTML = ''; // <<< ESSA LINHA É A CHAVE! Tem que estar aqui! >>>

    // Filtra as cartas por tipo e anexa aos respectivos contêineres
    this.availableCards.forEach(card => {
        if (card.type === 'Tank') {
            this.availableTanksContainer.appendChild(card.render(true));
        } else if (card.type === 'Damage') {
            this.availableDamageContainer.appendChild(card.render(true));
        } else if (card.type === 'Healer') {
            this.availableHealersContainer.appendChild(card.render(true));
        } 
        else if (card.type === 'Feiticeiro') {
            this.availableFeiticeirosContainer.appendChild(card.render(true));
        }
    });
},

    updateDraftTurnText: function() {
        const currentPlayer = this.players[this.currentPlayerId];
        this.draftTurnTextElem.textContent = `Turno de Draft: ${currentPlayer.name} (Escolha ${currentPlayer.selectedCards + 1} de ${MAX_CARDS_PER_PLAYER})`;
    },

    selectCard: function(cardId) {
        if (this.players[this.currentPlayerId].selectedCards >= MAX_CARDS_PER_PLAYER) {
            this.addLog(`Erro: ${this.players[this.currentPlayerId].name} já selecionou ${MAX_CARDS_PER_PLAYER} cartas.`);
            return;
        }

        const cardIndex = this.availableCards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return; // Carta não encontrada (já foi draftada)

        const selectedCard = this.availableCards.splice(cardIndex, 1)[0];
        selectedCard.owner = this.currentPlayerId; // Atribui o proprietário
        this.players[this.currentPlayerId].draftedCards.push(selectedCard);
        this.players[this.currentPlayerId].selectedCards++;

        this.addLog(`${this.players[this.currentPlayerId].name} escolheu ${selectedCard.name}.`);
        this.draftSound.play(); 

        this.renderAvailableCards(); // Re-renderiza para remover a carta draftada
        this.renderDraftedCardsSummary(); // Atualiza o resumo das cartas draftadas

        // Troca de jogador para a próxima escolha ou encerra o draft
        if (this.players.player1.selectedCards + this.players.player2.selectedCards < MAX_CARDS_PER_PLAYER * 2) {
            this.currentPlayerId = (this.currentPlayerId === 'player1') ? 'player2' : 'player1';
            this.draftOrder.push(this.currentPlayerId);
            this.updateDraftTurnText();
        } else {
            this.addLog("Draft concluído! Verifique seus times e inicie a batalha.");
            this.startBattleButton.classList.remove('hidden');
            this.draftTurnTextElem.textContent = "Draft Concluído!";
        }
    },

    renderDraftedCardsSummary: function() {
        this.player1DraftCardsDiv.innerHTML = '';
        this.players.player1.draftedCards.forEach(card => {
            this.player1DraftCardsDiv.appendChild(card.render(false, false, false));
        });
        this.player2DraftCardsDiv.innerHTML = '';
        this.players.player2.draftedCards.forEach(card => {
            this.player2DraftCardsDiv.appendChild(card.render(false, false, false));
        });
    },

   startBattlePhase: async function() {
        // Validação: Verificar se cada jogador escolheu 2 Tanks
        const p1Tanks = this.players.player1.draftedCards.filter(c => c.type === 'Tank').length;
        const p2Tanks = this.players.player2.draftedCards.filter(c => c.type === 'Tank').length;

        if (p1Tanks !== 2 || p2Tanks !== 2) {
            let errorMessage = "Erro: Cada jogador deve escolher exatamente 2 Tanks para o seu time.\n";
            if (p1Tanks !== 2) errorMessage += `* ${this.players.player1.name}: ${p1Tanks} Tanks (precisa de 2)\n`;
            if (p2Tanks !== 2) errorMessage += `* ${this.players.player2.name}: ${p2Tanks} Tanks (precisa de 2)`;
            
            this.addLog(errorMessage);
            alert(errorMessage); 
            return; 
        }

        // Determina quem começa a batalha: aquele que escolheu a SEGUNDA carta no draft.
        this.firstPlayerInBattle = this.draftOrder[1];
        this.currentPlayerId = this.firstPlayerInBattle;
        this.battleTurn = 1;

        this.addLog(`A batalha vai começar! ${this.players[this.firstPlayerInBattle].name} começa o primeiro turno.`);

        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;

        // Inicializa campos de batalha com slots vazios e posiciona cartas automaticamente
        this.setupBattlefield();

        this.showScreen('battlePhase');
        this.promptCardPlacement(); // Isso chama autoPlaceCards e inicia o turno
        
        // NOVO BLOCO PARA ATIVAÇÃO DO NARUTO NO INÍCIO DA BATALHA
        const narutoPlayer1 = this.players.player1.team.find(c => c.id === 'light2' && c.currentLife > 0);
        const narutoPlayer2 = this.players.player2.team.find(c => c.id === 'light2' && c.currentLife > 0);

        if (narutoPlayer1 && narutoPlayer1.specialEffect) {
            console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade do Naruto do Jogador 1!`);
            // Passa 'game', a própria carta Naruto, e null para target
            narutoPlayer1.specialEffect(this, narutoPlayer1, null); 
        }
        if (narutoPlayer2 && narutoPlayer2.specialEffect) {
            console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade do Naruto do Jogador 2!`);
            // Se o Jogador 2 também tiver Naruto, o escudo será ativado para ele
            narutoPlayer2.specialEffect(this, narutoPlayer2, null); 
        }
         // Ativação do Hyakkimaru
    const hyakkimaruPlayer1 = this.players.player1.team.find(c => c.id === 'dark1' && c.currentLife > 0);
    const hyakkimaruPlayer2 = this.players.player2.team.find(c => c.id === 'dark1' && c.currentLife > 0);

    if (hyakkimaruPlayer1 && hyakkimaruPlayer1.specialEffect) {
        console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade do Hyakkimaru do Jogador 1!`);
        hyakkimaruPlayer1.specialEffect(this, hyakkimaruPlayer1, null); 
    }
    if (hyakkimaruPlayer2 && hyakkimaruPlayer2.specialEffect) {
        console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade do Hyakkimaru do Jogador 2!`);
        hyakkimaruPlayer2.specialEffect(this, hyakkimaruPlayer2, null); 
    }
      const sungJinWooPlayer1 = this.players.player1.team.find(c => c.id === 'dark5' && c.currentLife > 0);
    const sungJinWooPlayer2 = this.players.player2.team.find(c => c.id === 'dark5' && c.currentLife > 0);

    if (sungJinWooPlayer1 && sungJinWooPlayer1.specialEffect) {
        console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade de BUFF TANK do Sung Jin-woo do Jogador 1!`);
        sungJinWooPlayer1.specialEffect(this, sungJinWooPlayer1, null); 
    }
    if (sungJinWooPlayer2 && sungJinWooPlayer2.specialEffect) {
        console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade de BUFF TANK do Sung Jin-woo do Jogador 2!`);
        sungJinWooPlayer2.specialEffect(this, sungJinWooPlayer2, null); 
    }
    const yugiPlayer1 = this.players.player1.team.find(c => c.id === 'light6' && c.currentLife > 0);
    const yugiPlayer2 = this.players.player2.team.find(c => c.id === 'light6' && c.currentLife > 0);

    if (yugiPlayer1 && yugiPlayer1.specialEffect) {
        console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade de TRANSFORMAÇÃO do Yugi do Jogador 1!`);
        yugiPlayer1.specialEffect(this, yugiPlayer1, null); 
    }
    if (yugiPlayer2 && yugiPlayer2.specialEffect) {
        console.log(`[DEBUG - BATALHA INICIADA] Ativando habilidade de TRANSFORMAÇÃO do Yugi do Jogador 2!`);
        yugiPlayer2.specialEffect(this, yugiPlayer2, null); 
    }
    const uzuiPlayer1 = this.players.player1.team.find(c => c.id === 'water6' && c.currentLife > 0);
const uzuiPlayer2 = this.players.player2.team.find(c => c.id === 'water6' && c.currentLife > 0);

if (uzuiPlayer1 && uzuiPlayer1.specialEffect && !uzuiPlayer1.hasUsedSpecialAbilityOnce) {
    console.log(`%c[DEBUG - BATALHA INICIADA] Ativando habilidade de Partitura autom\u00e1tica do Uzui do Jogador 1!`, 'color: #00BFFF;'); // Azul vibrante para Uzui
    await uzuiPlayer1.specialEffect(this, uzuiPlayer1, null); // Passa null para target, pois ele escolhe aleatoriamente
}
if (uzuiPlayer2 && uzuiPlayer2.specialEffect && !uzuiPlayer2.hasUsedSpecialAbilityOnce) {
    console.log(`%c[DEBUG - BATALHA INICIADA] Ativando habilidade de Partitura autom\u00e1tica do Uzui do Jogador 2!`, 'color: #00BFFF;');
    await uzuiPlayer2.specialEffect(this, uzuiPlayer2, null); // Passa null para target
}
    
    },

    setupBattlefield: function() {
        this.player1BattleNameElem.textContent = this.players.player1.name;
        this.player2BattleNameElem.textContent = this.players.player2.name;

        // Limpa as cartas existentes de todos os slots
        PLAYER_1_POSITIONS.forEach(posId => { document.getElementById(posId).innerHTML = ''; });
        PLAYER_2_POSITIONS.forEach(posId => { document.getElementById(posId).innerHTML = ''; });
    },

    promptCardPlacement: function() {
        this.autoPlaceCards();
        this.updateUI(); // Atualiza a UI inicial após o posicionamento
        this.startTurn();
    },

    autoPlaceCards: function() {
        const placePlayerCards = (playerObj) => {
            let battleTeamCopy = playerObj.draftedCards.map(cardData => new Card(
                cardData.id, cardData.name, cardData.type, [cardData.attackMin, cardData.attackMax],
                cardData.maxLife, cardData.element, cardData.effectDescription, cardData.specialEffect
            ));
            playerObj.team = []; 
            playerObj.defeatedCards = []; 

            let tanks = battleTeamCopy.filter(c => c.type === 'Tank');
            let others = battleTeamCopy.filter(c => c.type !== 'Tank');

            const positionsToFill = ['pos1', 'pos2', 'pos3', 'pos4', 'pos5'];

            for (let i = 0; i < positionsToFill.length; i++) {
                const currentPosition = positionsToFill[i];
                let cardToPlace = null;

                if (i < 2) { 
                    if (tanks.length > 0) {
                        cardToPlace = tanks.shift();
                    } else if (others.length > 0) { 
                        cardToPlace = others.shift();
                    }
                } else { 
                    if (others.length > 0) { 
                        cardToPlace = others.shift();
                    } else if (tanks.length > 0) { 
                        cardToPlace = tanks.shift();
                    }
                }
                
                if (cardToPlace) {
                    cardToPlace.owner = playerObj.name === this.players.player1.name ? 'player1' : 'player2'; 
                    cardToPlace.position = currentPosition;
                    const slotElement = this.getBattlefieldSlot(cardToPlace.owner, cardToPlace.position);
                    if (slotElement) {
                        slotElement.innerHTML = ''; 
                        slotElement.appendChild(cardToPlace.render(false, true)); 
                        playerObj.team.push(cardToPlace); 
                    } else {
                        console.error(`Elemento do slot não encontrado para ${cardToPlace.owner}, posição ${cardToPlace.position}`);
                    }
                }
            }
        };

        placePlayerCards(this.players.player1);
        placePlayerCards(this.players.player2);

        this.addLog("Cartas posicionadas automaticamente no campo de batalha.");
        // Removido logs de debug de Time do Jogador X após autoPosicionamento
    },

    startTurn: async function() {
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.attackButton.classList.add('hidden');
        this.healButton.classList.add('hidden');

        const currentPlayer = this.players[this.currentPlayerId];
        const opponentPlayer = this.players[this.getOpponent(this.currentPlayerId)];

        // Verifica game over antes de processar o turno
        if (currentPlayer.team.filter(c => c.currentLife > 0).length === 0) {
            this.endGame(opponentPlayer.name);
            return;
        }
        if (opponentPlayer.team.filter(c => c.currentLife > 0).length === 0) {
            this.endGame(currentPlayer.name);
            return;
        }

        // Mensagem e som de transição de turno
        this.addLog(`--- AGORA É A VEZ DE ${currentPlayer.name.toUpperCase()} ---`);
        this.battleTurnTextElem.textContent = `Turno de ${currentPlayer.name}`;
        this.turnTransitionSound.play();

        // Processa efeitos de início de turno para todas as cartas do jogador atual
        for (const card of currentPlayer.team) {
            if (card.currentLife <= 0) continue; 

            card.hasAttackedThisTurn = false; 
            await this.processTurnStartEffects(card);
        }
        
        // Garante que a habilidade de Toph só é usada uma vez por turno, resetando a flag
        currentPlayer.team.filter(c => c.id === 'earth2').forEach(toph => {
            toph.hasUsedSpecialAbilityOnce = false;
        });

        this.updateUI(); 

        // Removido log de debug de Naruto no time. Habilidade de início de turno processada.
    },

    processTurnStartEffects: async function(card) {
        if (card.currentLife <= 0) return; 

        // Processa efeitos ao longo do tempo (Queimar, Amaldiçoar, Escudo, EsquivaChance, Partitura)
        for (const effectName in card.effectsApplied) {
    const effect = card.effectsApplied[effectName];
    console.log(`%c[DEBUG EFFECTS] Processando efeito: ${effectName}, Turnos: ${effect.turns} para ${card.name}`, 'color: #DA70D6;');

    // Esta parte continua a mesma: Queimar e Amaldiçoar causam dano por turno e decrementam turnos
    if (effect.turns > 0) {
        if (effectName === 'Queimar' || effectName === 'Amaldiçoar') {
            this.dealDamage(card, effect.value);
            this.addLog(`${card.name} sofreu ${effect.value} de dano de ${effectName}. Vida: ${card.currentLife}`);
        }
        effect.turns--; // Decrementa os turnos para efeitos TEMPORÁRIOS
    }

    // AGORA, SÓ REMOVA O EFEITO SE ELE NÃO FOR 'Escudo' OU 'Partitura' E SE SEUS TURNOS CHEGARAM A ZERO
    if (effect.turns === 0 && effectName !== 'Escudo' && effectName !== 'Partitura') {
        if (effectName === 'Amaldiçoar' || effectName === 'Enraizar' || effectName === 'Atordoar') {
            card.canAttack = true;
        }
        this.reRenderCard(card); // Força a renderização para remover o visual do efeito expirado
        delete card.effectsApplied[effectName];
        this.addLog(`${card.name} não está mais sob efeito de ${effectName}.`);
    }
}
            
        // Remove o bônus de ataque de Hyakkimaru se sua fonte (Hyakkimaru) for derrotada
        if (card.tempAttackBonusSource) {
            const hyakkimaruSourceCard = this.getCardById(card.tempAttackBonusSource); 
            if (!hyakkimaruSourceCard || hyakkimaruSourceCard.currentLife <= 0) {
                card.tempAttackBonus = 0;
                card.tempAttackBonusSource = null;
                this.addLog(`${card.name} perdeu o bônus de ataque de Hyakkimaru, que foi derrotado.`);
            }
        }
        
        // Habilidades de início de turno de cartas específicas (Naruto removido daqui)
        const currentPlayer = this.players[this.currentPlayerId]; 

        // Tsunade's healing (earth5)
        if (card.id === 'earth5' && card.specialEffect) {
            await card.specialEffect(this, card, null); 
        }
        
        // Toph's shield (earth2)
        if (card.id === 'earth2' && card.specialEffect) {
            await card.specialEffect(this, card, null); 
        }
    },

      handleCardClick: async function(cardId) {
        const clickedCard = this.getCardById(cardId);
        if (!clickedCard || clickedCard.currentLife <= 0) { 
            this.addLog("Esta carta est\u00e1 derrotada ou n\u00e3o \u00e9 v\u00e1lida.");
            console.log(`%c[DEBUG CLICK] Carta inv\u00e1lida: ${clickedCard ? clickedCard.name : 'N/A'}, Vida: ${clickedCard ? clickedCard.currentLife : 'N/A'}`, 'color: orange;');
            this.attackButton.classList.add('hidden');
            this.healButton.classList.add('hidden');
            this.clearSelections();
            return;
        }

        console.log(`%c[DEBUG CLICK] Clicou em: ${clickedCard.name} (ID: ${clickedCard.id}, Dono: ${clickedCard.owner})`, 'color: cyan;');

        // Se nenhum atacante está selecionado, o clique é para SELECIONAR um atacante/curandeiro
        if (!this.selectedAttacker) { 
            console.log(`%c[DEBUG CLICK] Nenhuma carta atacante selecionada.`, 'color: cyan;');
            
            const isOwner = clickedCard.owner === this.currentPlayerId;
            const hasNotActed = !clickedCard.hasAttackedThisTurn;
            const canPerformAction = clickedCard.canAttack;
            const isAlive = clickedCard.currentLife > 0;
            
            console.log(`%c[DEBUG CLICK] Checando condi\u00e7\u00f5es iniciais para ${clickedCard.name}: Dono OK? ${isOwner}, N\u00e3o agiu? ${hasNotActed}, Pode agir? ${canPerformAction}, Viva? ${isAlive}`, 'color: cyan;');

            if (isOwner && hasNotActed && canPerformAction && isAlive) {
                console.log(`%c[DEBUG CLICK] ${clickedCard.name} passou nas condi\u00e7\u00f5es iniciais.`, 'color: lightgreen;');
                this.selectedAttacker = clickedCard;
                this.addLog(`Voc\u00ea selecionou ${clickedCard.name}.`);
                this.updateUI(); 
                
                // >>> NOVA LÓGICA DE EXIBIÇÃO DE BOTÕES DE AÇÃO: Ordem de prioridade importa <<<
                // Prioridade 1: Rengoku (fire5) - Healer que ataca se tiver aliado de Fogo
                if (clickedCard.id === 'fire5') { 
                    const fireAllies = this.getPlayersCards(clickedCard.owner).filter(c => c.element === 'Fogo' && c.id !== clickedCard.id && c.currentLife > 0);
                    if (fireAllies.length >= 1) { 
                        this.attackButton.classList.remove('hidden');
                        this.healButton.classList.add('hidden');
                        this.addLog(`Rengoku pode atacar devido \u00e0 presen\u00e7a de outros aliados de Fogo.`);
                        console.log(`%c[DEBUG BUTTONS] Rengoku: ATACAR exibido.`, 'color: #00ff00;');
                    } else { 
                        this.healButton.classList.remove('hidden');
                        this.attackButton.classList.add('hidden');
                        this.addLog(`${clickedCard.name} precisa de outro aliado de Fogo para ativar sua habilidade de ataque. Pode apenas curar.`);
                        console.log(`%c[DEBUG BUTTONS] Rengoku: CURAR exibido (sem aliado de Fogo).`, 'color: #00ff00;');
                    }
                } 
                // Prioridade 2: Feiticeiros (Sung Jin-woo, Yugi) - N\u00c3O t\u00eam bot\u00f5es de a\u00e7\u00e3o para o jogador clicar
                else if (clickedCard.type === 'Feiticeiro') { 
                    this.addLog(`${clickedCard.name} \u00e9 um Feiticeiro. Suas habilidades s\u00e3o passivas ou autom\u00e1ticas.`);
                    console.log(`%c[DEBUG BUTTONS] Feiticeiro: NENHUM bot\u00e3o exibido.`, 'color: #ffff00;');
                    this.attackButton.classList.add('hidden'); 
                    this.healButton.classList.add('hidden');
                    this.clearSelections(); // Limpa a sele\u00e7\u00e3o, pois n\u00e3o h\u00e1 a\u00e7\u00e3o para o jogador clicar
                    return; // Sai da fun\u00e7\u00e3o
                }
                // Prioridade 3: Outros Healers (Merlin, Julius, Noelle, Tsunade, Akali) - Mostram APENAS CURAR
                else if (clickedCard.type === 'Healer') { // Inclui Merlin (dark6) e Julius (light5) aqui
                    this.healButton.classList.remove('hidden');
                    this.attackButton.classList.add('hidden');
                    console.log(`%c[DEBUG BUTTONS] Healer comum: CURAR exibido.`, 'color: #00ff00;');
                } 
                // Prioridade 4: Qualquer outra carta (Tank, Damage) - Mostram APENAS ATACAR
                else {
                    this.attackButton.classList.remove('hidden');
                    this.healButton.classList.add('hidden');
                    console.log(`%c[DEBUG BUTTONS] Damage/Tank: ATACAR exibido.`, 'color: #00ff00;');
                }

            } else { // Uma das 4 condi\u00e7\u00f5es iniciais (dono, n\u00e3o agiu, pode agir, viva) falhou
                console.log(`%c[DEBUG CLICK] ${clickedCard.name} N\u00c3O passou nas condi\u00e7\u00f5es iniciais. Dono OK? ${isOwner}, N\u00e3o agiu? ${hasNotActed}, Pode agir? ${canPerformAction}, Viva? ${isAlive}`, 'color: darkred;');
                if (clickedCard.owner !== this.currentPlayerId) {
                    this.addLog("Voc\u00ea deve selecionar uma de suas pr\u00f3prias cartas para agir.");
                } else if (clickedCard.hasAttackedThisTurn) {
                    this.addLog("Esta carta j\u00e1 agiu neste turno.");
                } else if (!clickedCard.canAttack) {
                    this.addLog("Esta carta est\u00e1 sob um efeito que impede sua a\u00e7\u00e3o.");
                } else if (clickedCard.currentLife <= 0) { 
                    this.addLog("Esta carta est\u00e1 derrotada.");
                }
                console.log(`%c[DEBUG BUTTONS] Escondendo bot\u00f5es ap\u00f3s falha inicial.`, 'color: yellow;');
                this.attackButton.classList.add('hidden'); 
                this.healButton.classList.add('hidden'); 
                this.clearSelections(); 
            }
        } 
        // Se um atacante j\u00e1 est\u00e1 selecionado, o clique \u00e9 para SELECIONAR um alvo
        else { 
            console.log(`%c[DEBUG CLICK] Atacante j\u00e1 selecionado: ${this.selectedAttacker.name}. Selecionando alvo: ${clickedCard.name}.`, 'color: cyan;');
            // Oculta botões enquanto espera seleção de alvo válida ou ação
            this.attackButton.classList.add('hidden');
            this.healButton.classList.add('hidden');

            if (this.selectedAttacker.owner === clickedCard.owner) { 
                if (this.selectedAttacker.type === 'Healer') { // N\u00e3o precisa mais checar IDs espec\u00edficos aqui, apenas o tipo
                    if (this.selectedAttacker.id === 'light5') { // Julius tem checagens espec\u00edficas
                        if (this.selectedAttacker.hasUsedSpecialAbilityOnce) {
                            this.addLog(`${this.selectedAttacker.name} j\u00e1 usou sua habilidade especial neste jogo.`);
                            this.clearSelections();
                            return;
                        }
                        const hasNegativeEffects = Object.keys(this.selectedTarget.effectsApplied).some(effectName => ['Amaldi\u00e7oar', 'Queimar', 'Enraizar', 'Atordoar'].includes(effectName));
                        if (clickedCard.currentLife >= clickedCard.maxLife && !hasNegativeEffects) {
                            this.addLog(`${clickedCard.name} j\u00e1 tem vida m\u00e1xima e nenhum efeito negativo para Julius Novachrono purificar.`);
                            this.clearSelections();
                            return;
                        }
                    } 
                    this.selectedTarget = clickedCard; 
                    this.addLog(`Voc\u00ea selecionou ${clickedCard.name} como alvo de cura/habilidade.`);
                    console.log(`%c[DEBUG BUTTONS] Alvo aliado v\u00e1lido. Reexibindo bot\u00f5es.`, 'color: #00ff00;');
                    this.healButton.classList.remove('hidden'); 
                    this.attackButton.classList.add('hidden');
                    this.updateUI();
                } else { 
                    this.addLog("Cartas de dano n\u00e3o podem curar aliados.");
                    this.clearSelections();
                    console.log(`%c[DEBUG BUTTONS] N\u00e3o Healer, esconde bot\u00f5es.`, 'color: yellow;');
                }
            } 
            else { 
                if (this.selectedAttacker.type !== 'Healer' || this.selectedAttacker.id === 'fire5') { 
                    const opponentFrontRow = this.players[this.getOpponent(this.currentPlayerId)].team.filter(c => c.currentLife > 0 && (c.position === 'pos1' || c.position === 'pos2'));
                    let validTarget = false;
                    const canIgnoreTanks = (this.selectedAttacker.id === 'water4' || this.selectedAttacker.id === 'dark4' || this.selectedAttacker.id === 'light4'); 

                    if (opponentFrontRow.length > 0) { 
                        if (canIgnoreTanks) { validTarget = true; } 
                        else if ((clickedCard.position === 'pos1' || clickedCard.position === 'pos2')) { validTarget = true; } 
                        else { this.addLog("Voc\u00ea deve atacar as cartas da frente (Tanks) primeiro."); this.clearSelections(); return; }
                    } else { validTarget = true; }

                    if (validTarget && clickedCard.currentLife > 0) {
                        this.selectedTarget = clickedCard;
                        this.addLog(`Voc\u00ea selecionou ${clickedCard.name} como alvo.`);
                        console.log(`%c[DEBUG BUTTONS] Alvo inimigo v\u00e1lido. Reexibindo bot\u00f5es.`, 'color: #00ff00;');
                        this.attackButton.classList.remove('hidden'); 
                        this.healButton.classList.add('hidden');
                        this.updateUI();
                    } else if (clickedCard.currentLife <= 0) {
                        this.addLog("O alvo selecionado j\u00e1 est\u00e1 derrotado.");
                        this.clearSelections();
                        console.log(`%c[DEBUG BUTTONS] Alvo derrotado, esconde bot\u00f5es.`, 'color: yellow;');
                    }
                } else { 
                    this.addLog("Esta carta n\u00e3o pode atacar inimigos.");
                    this.clearSelections();
                    console.log(`%c[DEBUG BUTTONS] N\u00e3o atacante inimigo, esconde bot\u00f5es.`, 'color: yellow;');
                }
            }
        }
    },

   processAction: async function(actionType) {
    try { 
        if (!this.selectedAttacker || !this.selectedTarget) {
            this.addLog("Selecione uma carta sua e um alvo primeiro.");
            console.log(`%c[DEBUG PROCESSACTION] Falha: Atacante ou alvo n\u00e3o selecionado.`, 'color: red;');
            return;
        }
        console.log(`%c[DEBUG PROCESSACTION] Processando a\u00e7\u00e3o: ${actionType} com ${this.selectedAttacker.name} -> ${this.selectedTarget.name}`, 'color: magenta;');

        if (actionType === 'attack') {
            if (this.selectedAttacker.type === 'Healer' && this.selectedAttacker.id !== 'fire5') { 
                this.addLog("Healers n\u00e3o podem atacar inimigos, a menos que tenham um efeito especial.");
                console.log(`%c[DEBUG PROCESSACTION] Falha: Healer sem permiss\u00e3o de ataque.`, 'color: red;');
                this.clearSelections();
                return;
            }

            this.addLog(`${this.selectedAttacker.name} atacando ${this.selectedTarget.name}!`);
            await this.performAttack(this.selectedAttacker, this.selectedTarget);

        } else if (actionType === 'heal') {
            // >>> NOVA LÓGICA PARA MERLIN <<<
            if (this.selectedAttacker.id === 'dark6') { // Se o atacante é a Merlin
                console.log(`%c[DEBUG PROCESSACTION] Merlin selecionada para DRENAR CURA.`, 'color: magenta;');
                await this.selectedAttacker.specialEffect(this, this.selectedAttacker, this.selectedTarget); // Chama o specialEffect da Merlin
            }
            // >>> FIM DA NOVA LÓGICA PARA MERLIN <<<
            else if (this.selectedAttacker.type !== 'Healer' && this.selectedAttacker.type !== 'Feiticeiro') { 
                this.addLog("Apenas Healers ou Feiticeiros podem curar/usar esta habilidade.");
                console.log(`%c[DEBUG PROCESSACTION] Falha: N\u00e3o Healer/Feiticeiro.`, 'color: red;');
                this.clearSelections();
                return;
            }
            if (this.selectedAttacker.type === 'Healer' && this.selectedTarget.owner !== this.selectedAttacker.owner) {
                this.addLog("Voc\u00ea s\u00f3 pode curar seus pr\u00f3prios aliados.");
                console.log(`%c[DEBUG PROCESSACTION] Falha: Alvo n\u00e3o aliado para Healer.`, 'color: red;');
                this.clearSelections();
                return;
            }

            // Checagens espec\u00edficas para Julius Novachrono (light5)
            if (this.selectedAttacker.id === 'light5') {
                if (this.selectedAttacker.hasUsedSpecialAbilityOnce) {
                    this.addLog(`${this.selectedAttacker.name} j\u00e1 usou sua habilidade especial neste jogo.`);
                    console.log(`%c[DEBUG PROCESSACTION] Julius: J\u00e1 usado.`, 'color: red;');
                    this.clearSelections();
                    return;
                }
                const hasNegativeEffects = Object.keys(this.selectedTarget.effectsApplied).some(effectName => ['Amaldi\u00e7oar', 'Queimar', 'Enraizar', 'Atordoar'].includes(effectName));
                if (this.selectedTarget.currentLife >= this.selectedTarget.maxLife && !hasNegativeEffects) { 
                    this.addLog(`${this.selectedTarget.name} j\u00e1 tem vida m\u00e1xima e nenhum efeito negativo para Julius Novachrono purificar.`);
                    console.log(`%c[DEBUG PROCESSACTION] Julius: Alvo vida cheia ou sem efeitos negativos.`, 'color: red;');
                    this.clearSelections();
                    return;
                }
            } 
            // Sung Jin-woo (dark5) l\u00f3gica est\u00e1 no specialEffect e handleCardClick j\u00e1 validou antes.
            // N\u00e3o h\u00e1 condi\u00e7\u00f5es adicionais aqui para ele.
            // A chamada a performHeal para Sung Jin-woo ser\u00e1 feita abaixo.

            // Se não é Merlin ou Julius, então é um healer normal ou Sung Jin-woo
            if (this.selectedAttacker.id !== 'dark6' && this.selectedAttacker.id !== 'light5') {
                 this.addLog(`${this.selectedAttacker.name} curando/usando habilidade em ${this.selectedTarget ? this.selectedTarget.name : 'N/A'}!`);
                 await this.performHeal(this.selectedAttacker, this.selectedTarget);
            }
        }

        this.selectedAttacker.hasAttackedThisTurn = true;
        console.log(`%c[DEBUG PROCESSACTION] A\u00e7\u00e3o conclu\u00edda. Limpando sele\u00e7\u00f5es.`, 'color: magenta;');
        this.clearSelections(); 
        this.endTurn(); 
    } catch (error) { 
        console.error(`%c[ERRO CR\u00cdTICO] Erro em processAction:`, 'color: white; background-color: red; padding: 5px;', error);
        this.addLog(`ERRO no jogo: ${error.message}. Reinicie o jogo.`);
        this.clearSelections();
    }
},

 performAttack: async function(attacker, target, isSecondHit = false) {
    // 1. Início do Processo de Ataque
    this.isProcessingAttack = true; // Marca que um ataque está em andamento
    if (!isSecondHit) { // Se não é o segundo hit do Toji (para não tocar som ou contar ataque duas vezes)
        this.attackSound.play(); // Toca o som de ataque
        this.currentDamageDealt = 0; // Reseta o dano causado para este ataque
        this.attackCountForPlayer[attacker.owner]++; // Incrementa contador de ataque do jogador (para Blastoise)
    }

    // 2. Animação do Atacante
    const attackerElement = document.getElementById(`card-${attacker.id}`);
    if (attackerElement) {
        attackerElement.style.animation = 'attack-move 0.3s ease-out forwards'; // Inicia animação de ataque
        await this.sleep(300); // Espera a animação um pouco
    }

    // 3. Cálculo do Dano Base
    // Dano aleatório dentro do range de ataque do atacante, considerando bônus temporários
    let rawDamage = Math.floor(Math.random() * (attacker.attackMax + attacker.tempAttackBonus - (attacker.attackMin + attacker.tempAttackBonus) + 1)) + (attacker.attackMin + attacker.tempAttackBonus);
    let finalDamage = rawDamage; // Dano que será ajustado pelas habilidades

    // 4. Habilidades Específicas do ATACANTE que MODIFICAM O DANO OU ATAQUE
    let gojoDoubleDamage = false;
    if (attacker.id === 'light3' && attacker.specialEffect) { // Gojo (Luz): 20% de chance de dobrar o dano
        const result = await attacker.specialEffect(this, attacker, target);
        if (result === 2) {
            finalDamage *= 2;
            gojoDoubleDamage = true; // Flag para ignorar multiplicador elemental depois
        }
    }

    let tobiramaBonus = 0;
    if (attacker.id === 'water3' && attacker.specialEffect) { // Tobirama (Água): Dano extra contra Fogo
        tobiramaBonus = await attacker.specialEffect(this, attacker, target);
        finalDamage += tobiramaBonus;
    }

    // Might Guy (Terra): Informa quanto de escudo ele ignora. A lógica de ignorar é em dealDamage.
    let ignoredShieldAmount = 0;
    if (attacker.id === 'earth4' && attacker.specialEffect) {
        ignoredShieldAmount = await attacker.specialEffect(this, attacker, target);
    }
    // Kakashi (Luz): Ignora escudo e esquiva. Lógica de ignorar é em dealDamage.

    // 5. Multiplicador Elemental (se Gojo não dobrou o dano)
    let elementalMultiplier = 1;
    if (!gojoDoubleDamage) { // Se Gojo não dobrou, aplicamos a vantagem elemental
        const attackerElement = attacker.element;
        const targetElement = target.element;

        const elementalAdvantages = {
            'Fogo': 'Ar', 'Ar': 'Terra', 'Terra': 'Agua', 'Agua': 'Fogo'
        };
        const darkLightAdvantage = {
            'Dark': 'Luz', 'Luz': 'Dark'
        };

        if (elementalAdvantages[attackerElement] === targetElement) {
            elementalMultiplier = 1.5;
            this.addLog(`${attacker.name} (${attackerElement}) tem vantagem elemental contra ${target.name} (${targetElement})!`);
        } else if (elementalAdvantages[targetElement] === attackerElement) {
            elementalMultiplier = 1 / 1.5;
            this.addLog(`${attacker.name} (${attackerElement}) tem desvantagem elemental contra ${target.name} (${targetElement})!`);
        } else if (darkLightAdvantage[attackerElement] === targetElement) {
            elementalMultiplier = 1.5;
            this.addLog(`${attacker.name} (${attackerElement}) tem vantagem ofensiva contra ${target.name} (${targetElement})!`);
        } else if (darkLightAdvantage[targetElement] === attackerElement) {
            elementalMultiplier = 1 / 1.5;
            this.addLog(`${attacker.name} (${attackerElement}) tem desvantagem ofensiva contra ${target.name} (${targetElement})!`);
        }
    }
    finalDamage = Math.floor(finalDamage * elementalMultiplier);

    // 6. Dano Extra da Partitura (Efeito no ALVO, mas calculado aqui para o total)
    if (target.effectsApplied['Partitura']) {
        const extraDamage = target.effectsApplied['Partitura'].value;
        finalDamage += extraDamage;
        this.addLog(`${target.name} sofreu ${extraDamage} de dano extra devido à Partitura!`);
        console.log(`%c[DEBUG UZUI - PARTITURA] ${target.name} recebeu ${extraDamage} de dano extra da Partitura.`, 'color: #00BFFF;');
    }
    
    this.currentDamageDealt = finalDamage; // Armazena o dano calculado FINAL (antes da defesa do alvo)

    // 7. Aplicar Dano ao Alvo (Função dealDamage lida com Escudo, Esquiva, Redução do alvo)
    // Passamos o atacante para dealDamage para que habilidades como Kakashi possam ignorar defesas.
    await this.dealDamage(target, finalDamage, attacker);

    // 8. Efeitos Pós-Dano no ALVO (reações do ALVO ao receber dano)
    // Estes efeitos só devem ocorrer se não for um "segundo hit" de habilidades (como Toji).
    if (!isSecondHit) {
        if (target.id === 'water1' && target.specialEffect) { // Blastoise (Água)
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'water2' && target.specialEffect) { // Kisame (Água)
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'earth3' && target.specialEffect) { // Edward Elric (Terra)
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'dark2' && target.specialEffect) { // Zeref (Dark)
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'wind2' && target.specialEffect) { // Aang (Ar)
            await target.specialEffect(this, target, target);
        }
    }
    

    // 9. Efeitos Pós-Ataque do ATACANTE (habilidades que ativam APÓS o ataque)
    // Estes efeitos só devem ocorrer se não for um "segundo hit" de habilidades (como Toji).
    if (!isSecondHit) {
        if (attacker.id === 'fire4' && attacker.specialEffect) { // Roy Mustang (Fogo)
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'fire5' && attacker.specialEffect) { // Rengoku (Fogo)
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'wind4' && attacker.specialEffect) { // Minato (Ar)
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'wind3' && attacker.specialEffect && !this.isTojiSecondHit) { // Toji (Ar): Ataque Duplo
            this.isTojiSecondHit = true; // Marca para o segundo hit
            await this.performAttack(attacker, target, true); // Chama a si mesmo para o segundo hit
            this.isTojiSecondHit = false; // Reseta a flag após o segundo hit
        }
        if (attacker.id === 'wind6' && attacker.specialEffect) { // Zoro (Ar): Aumenta ataque a cada golpe
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'light7' && attacker.specialEffect) { // Goku (Luz): Kamehameha (Dano em Área)
            // O specialEffect de Goku já lida com a aplicação de dano a múltiplos alvos.
            await attacker.specialEffect(this, attacker, target);
        }

        // --- ATIVAÇÃO DE ESCANOR E SUKUNA (ATAQUE CONJUNTO) ---
        // Encontra aliados do atacante que podem atacar junto (Escanor ou Sukuna)
        const potentialJointAttackers = this.getPlayersCards(attacker.owner).filter(c => 
            c.currentLife > 0 &&         // A carta está viva
            c.id !== attacker.id &&      // Não é o atacante principal que acabou de agir
            !c.hasAttackedThisTurn &&    // Não atacou junto ainda neste turno
            (c.id === 'fire1' || c.id === 'dark7') // É Escanor ou Sukuna
        );

        for (const jointAttacker of potentialJointAttackers) {
            if (jointAttacker.specialEffect) {
                // Chama o specialEffect da carta.
                // O specialEffect de Escanor lida com sua chance (50%).
                // O specialEffect de Sukuna SEMPRE ATIVA (já removemos o Math.random()).
                const hasAttackedJointly = await jointAttacker.specialEffect(this, jointAttacker, target);
                if (hasAttackedJointly) {
                    jointAttacker.hasAttackedThisTurn = true; // Marca o atacante conjunto como tendo agido
                }
            }
        }
        // --- FIM DA ATIVAÇÃO DE ESCANOR E SUKUNA ---
    }

    // 10. Finalização da Animação e Limpeza
    if (attackerElement) { attackerElement.style.animation = ''; } // Remove a animação do atacante
    this.isProcessingAttack = false; // Marca que o ataque terminou
},
    performHeal: async function(healer, target) {
        this.isProcessingHeal = true;
        this.healSound.play(); 

        const healerElement = document.getElementById(`card-${healer.id}`);
        if (healerElement) {
            healerElement.style.animation = 'attack-move 0.3s ease-out forwards'; 
            await sleep(300);
        }

        let healAmount = Math.floor(Math.random() * (healer.attackMax - healer.attackMin + 1)) + healer.attackMin;

        if (healer.id === 'water5' && healer.specialEffect) {
            healAmount += await healer.specialEffect(this, healer, target);
        }
        
        this.healCard(target, healAmount);
        this.addLog(`${healer.name} curou ${healAmount} de vida de ${target.name}. Vida: ${target.currentLife}`);

        if (healer.id === 'wind5' && healer.specialEffect) {
            await healer.specialEffect(this, healer, target);
        }

        if (healer.id === 'light5' && healer.specialEffect) {
            await healer.specialEffect(this, healer, target); 
        }
        if (healer.id === 'dark5' && healer.specialEffect) {
            await healer.specialEffect(this, healer, target); 
        }


        const targetElement = document.getElementById(`card-${target.id}`);
        if (targetElement) {
            targetElement.style.animation = 'target-heal 0.6s ease-out';
            await sleep(600);
            targetElement.style.animation = '';
        }

        if (healerElement) {
            healerElement.style.animation = '';
        }

        this.isProcessingHeal = false;
    },

dealDamage: async function(targetCard, amount, attacker = null) { // Adicione attacker como parametro opcional
    let damageToDeal = amount;

    // Efeitos de defesa que REDUZEM ou ANULAM dano ANTES do escudo
    let finalReduction = 0;

    // 1. Obito (wind1) - 35% de chance de esquivar COMPLETAMENTE
    if (targetCard.id === 'wind1' && targetCard.specialEffect) {
        const obitoDodged = await targetCard.specialEffect(this, targetCard, targetCard);
        if (obitoDodged) {
            this.addLog(`${targetCard.name} (Vento) esquivou completamente do ataque!`);
            damageToDeal = 0; // Zera o dano
            this.reRenderCard(targetCard); // Garante que a UI reflita a esquiva
            this.updateUI();
            return; // Sai da função, pois não há dano a ser aplicado
        }
    }

    // 2. EsquivaChance (Akali - wind5) - 50% de chance de esquivar
    // E verifica se o atacante NÃO é Kakashi (light4)
    if (targetCard.effectsApplied['EsquivaChance'] && attacker && attacker.id !== 'light4' && Math.random() < targetCard.effectsApplied['EsquivaChance'].value) {
        this.addLog(`${targetCard.name} esquivou do ataque devido ao efeito de Akali!`);
        damageToDeal = 0; // Zera o dano
        delete targetCard.effectsApplied['EsquivaChance']; // Remove o efeito após uso
        this.reRenderCard(targetCard);
        this.updateUI();
        return; // Sai da função
    }

    // 3. Gaara (earth1) - 50% de chance de reduzir 5 de dano
    if (targetCard.id === 'earth1' && targetCard.specialEffect) {
        const gaaraReduction = await targetCard.specialEffect(this, targetCard, targetCard);
        damageToDeal = Math.max(0, damageToDeal + gaaraReduction); // A redução é um valor negativo (-5)
        if (gaaraReduction < 0) { // Se houve redução de fato
            this.addLog(`${targetCard.name} (Terra) reduziu ${Math.abs(gaaraReduction)} de dano recebido!`);
        }
    }

    // 4. Hashirama (light1) - 50% de chance de reduzir 5 de dano
    if (targetCard.id === 'light1' && targetCard.specialEffect) {
        const hashiramaReduction = await targetCard.specialEffect(this, targetCard, targetCard);
        damageToDeal = Math.max(0, damageToDeal + hashiramaReduction); // A redução é um valor negativo (-5)
        if (hashiramaReduction < 0) { // Se houve redução de fato
            this.addLog(`${targetCard.name} (Luz) reduziu ${Math.abs(hashiramaReduction)} de dano recebido!`);
        }
    }
    
    // --- LÓGICA DO ESCUDO ---
    // Apenas se houver dano para aplicar e se o escudo existir e for maior que 0
    // E se o atacante NÃO é Kakashi (light4)
    if (damageToDeal > 0 && targetCard.effectsApplied['Escudo'] && targetCard.effectsApplied['Escudo'].value > 0 && (attacker === null || attacker.id !== 'light4')) {
        const shieldValue = targetCard.effectsApplied['Escudo'].value;
        let effectiveShield = shieldValue;

        // Might Guy (earth4) ignora escudo
        if (attacker && attacker.id === 'earth4') { // Might Guy
            const ignoredShield = 10; // Might Guy ignora 10 de escudo (valor fixo)
            effectiveShield = Math.max(0, shieldValue - ignoredShield); // Escudo efetivo após a ignorância de Might Guy
            if (ignoredShield > 0) {
                this.addLog(`${attacker.name} (Terra) ignorou ${ignoredShield} de Escudo de ${targetCard.name}.`);
            }
        }
        
        // Se o escudo efetivo ainda existir
        if (effectiveShield > 0) {
            const damageToShield = Math.min(damageToDeal, effectiveShield); // Quanto do dano será absorvido pelo escudo
            targetCard.effectsApplied['Escudo'].value -= damageToShield; // Reduz o escudo
            damageToDeal -= damageToShield; // Reduz o dano a ser aplicado na vida

            this.addLog(`${targetCard.name} absorveu ${damageToShield} de dano com seu escudo. Escudo restante: ${targetCard.effectsApplied['Escudo'].value}.`);
            console.log(`%c[DEBUG ESCUDO] Escudo absorveu ${damageToShield} de dano. Escudo restante: ${targetCard.effectsApplied['Escudo'].value}`, 'color: #00FFFF;');

            // Se o escudo foi zerado ou ficou negativo, remova-o
            if (targetCard.effectsApplied['Escudo'].value <= 0) {
                delete targetCard.effectsApplied['Escudo'];
                this.addLog(`O escudo de ${targetCard.name} foi quebrado!`);
                console.log(`%c[DEBUG ESCUDO] Escudo de ${targetCard.name} quebrado.`, 'color: #FFD700;');
            }
            this.reRenderCard(targetCard); // Atualiza o visual do escudo
        }
    }

    // Aplica o dano restante na vida da carta
    targetCard.currentLife -= damageToDeal;
    if (targetCard.currentLife < 0) targetCard.currentLife = 0;

    this.addLog(`${targetCard.name} recebeu ${damageToDeal} de dano na vida. Vida restante: ${targetCard.currentLife}`);
    console.log(`%c[DEBUG DEALDAMAGE] Vida final de ${targetCard.name}: ${targetCard.currentLife}`, 'color: #FF00FF;');

    // Efeito de Luffy: aumenta ataque se receber dano E o dano foi para a vida E ele não foi derrotado
    if (targetCard.id === 'earth6' && targetCard.specialEffect && targetCard.currentLife > 0 && damageToDeal > 0) {
        await targetCard.specialEffect(this, targetCard, null);
    }

    // Checagem de derrota (esta parte é crucial e já estava bem feita)
    if (targetCard.currentLife <= 0) {
        this.addLog(`${targetCard.name} foi derrotado!`);
        this.isCardDefeated = true;

        const playerTeam = this.players[targetCard.owner].team;
        const indexInTeam = playerTeam.findIndex(c => c.id === targetCard.id);
        if (indexInTeam > -1) {
            playerTeam.splice(indexInTeam, 1); // Remove a carta derrotada do time
        }

        let summoned = false;

        // Lógica de invocação (Yugi primeiro, depois Sung Jin-woo)
        const yugiInTeam = this.players[targetCard.owner].team.some(c => (c.id === 'light6' || c.id === 'yami_yugi') && c.currentLife > 0);
        if (yugiInTeam) {
            summoned = await this.summonMagoNegro(targetCard);
        }

        if (!summoned) {
            const sungJinWooInTeam = this.players[targetCard.owner].team.some(c => c.id === 'dark5' && c.currentLife > 0);
            if (sungJinWooInTeam) {
                summoned = await this.summonIgris(targetCard);
            }
        }

        // Se nada foi invocado, a carta vai para a lixeira oficial e mostra overlay "DERROTADO"
        if (!summoned) {
            this.playerDefeatedCard(targetCard);
            const slotOfDefeatedCard = this.getBattlefieldSlot(targetCard.owner, targetCard.position);
            if (slotOfDefeatedCard) {
                slotOfDefeatedCard.innerHTML = '';
                const defeatedOverlay = document.createElement('div');
                defeatedOverlay.classList.add('absolute', 'inset-0', 'bg-red-900', 'bg-opacity-70', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-xl', 'rounded-lg', 'text-white');
                defeatedOverlay.textContent = 'DERROTADO';
                slotOfDefeatedCard.appendChild(defeatedOverlay);
            }
        }

        // Efeitos de morte (Deidara, Madara)
        if (targetCard.id === 'fire3' && targetCard.specialEffect) { // Deidara
            await targetCard.specialEffect(this, targetCard, targetCard); // targetCard aqui é a carta que morreu (Deidara)
        }
        if (attacker && attacker.id === 'dark3' && attacker.specialEffect) { // Madara
            await attacker.specialEffect(this, attacker, targetCard); // targetCard aqui é a carta que Madara derrotou
        }

        this.isCardDefeated = false;
    } else {
        // Se a carta não foi derrotada, garantimos que ela seja renderizada para mostrar a nova vida ou escudo
        this.reRenderCard(targetCard);
    }
    this.updateUI(); // Atualiza a UI no final, para garantir que tudo esteja certo
},

    healCard: function(targetCard, amount) {
        targetCard.currentLife = Math.min(targetCard.maxLife, targetCard.currentLife + amount);
        this.updateUI(); 
    },

    applyEffect: function(card, effectName, turns, value) {
    let finalTurns = turns;
    // Se o efeito é 'Escudo' ou 'Partitura', marcamos como -1 (permanente)
    // assim ele não será removido automaticamente por turnos.
    if (effectName === 'Escudo' || effectName === 'Partitura') {
        finalTurns = -1; // -1 significa "dura para sempre"
    }

    card.effectsApplied[effectName] = { turns: finalTurns, value: value }; // Usamos finalTurns aqui
    if (effectName === 'Amaldiçoar' || effectName === 'Enraizar' || effectName === 'Atordoar') {
        card.canAttack = false;
    }
    console.log(`%c[DEBUG EFFECTS] Efeito '${effectName}' aplicado a ${card.name}. Turnos: ${finalTurns}, Valor: ${value}. Estado atual:`, 'color: #4682B4;', card.effectsApplied);
    this.reRenderCard(card);
    this.updateUI();
},

    addLog: function(message) {
        const logEntry = document.createElement('p');
        logEntry.textContent = message;
        this.gameLogDiv.appendChild(logEntry);
        this.gameLogDiv.scrollTop = this.gameLogDiv.scrollHeight; 
    },

      updateUI: function() {
        this.player1BattlefieldContainerElem.classList.remove('active-player-highlight');
        this.player2BattlefieldContainerElem.classList.remove('active-player-highlight');

        if (this.currentPhase === 'battle') { // A fase j\u00e1 deve ser 'battle' ou 'battlePhase'
            if (this.currentPlayerId === 'player1') {
                this.player1BattlefieldContainerElem.classList.add('active-player-highlight');
            } else if (this.currentPlayerId === 'player2') {
                this.player2BattlefieldContainerElem.classList.add('active-player-highlight');
            }
        }
        
        const allSlots = [
            ...PLAYER_1_POSITIONS.map(id => ({ id: id, owner: 'player1', pos: id.replace('p1_','') })),
            ...PLAYER_2_POSITIONS.map(id => ({ id: id, owner: 'player2', pos: id.replace('p2_','') }))
        ];

        allSlots.forEach(slotInfo => {
            const slotElement = document.getElementById(slotInfo.id);
            const cardInSlotData = this.players[slotInfo.owner].team.find(c => c.position === slotInfo.pos);

            // <<< MUDANÇA CRUCIAL AQUI: SEMPRE RE-RENDERIZA A CARTA INTEIRA SE ELA ESTÁ NO SLOT E VIVA >>>
            if (cardInSlotData && cardInSlotData.currentLife > 0) {
                // Ao invés de tentar atualizar partes, nós re-renderizamos a carta completa no seu slot
                // A fun\u00e7\u00e3o reRenderCard j\u00e1 faz isso perfeitamente
                this.reRenderCard(cardInSlotData); 
            } else { // Se não h\u00e1 carta no slot (vazio) ou a carta está morta
                if (slotElement.querySelector('.card')) { // Se h\u00e1 um card HTML, mas n\u00e3o tem cardData v\u00e1lido
                    slotElement.innerHTML = ''; // Limpa o slot
                }
                // Adiciona overlay de DERROTADO se a carta está morta e a div n\u00e3o tem o overlay
                if (!slotElement.querySelector('.absolute.inset-0.bg-red-900') && (cardInSlotData && cardInSlotData.currentLife <= 0)) {
                    const defeatedOverlay = document.createElement('div');
                    defeatedOverlay.classList.add('absolute', 'inset-0', 'bg-red-900', 'bg-opacity-70', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-xl', 'rounded-lg', 'text-white'); // Adicionado justify-content-center
                    defeatedOverlay.textContent = 'DERROTADO';
                    slotElement.appendChild(defeatedOverlay);
                } else if (!cardInSlotData) { // Se não há cardData (slot deveria estar vazio)
                     slotElement.innerHTML = ''; // Garante que o slot est\u00e1 limpo
                }
            }
        });
    },

  reRenderCard: function(card) {
    console.log(`%c[DEBUG RENDER] Tentando re-renderizar a carta: ${card.name} (ID: ${card.id})`, 'color: yellowgreen;');
    console.log(`%c[DEBUG RENDER] Efeitos no momento da renderiza\u00e7\u00e3o para ${card.name}:`, 'color: yellowgreen;', card.effectsApplied);
    const slotElement = this.getBattlefieldSlot(card.owner, card.position);

    if (slotElement) {
        console.log(`%c[DEBUG RENDER] Slot encontrado para ${card.name}: ${slotElement.id}`, 'color: yellowgreen;');

        // REMOVIDO: slotElement.style.border = '3px solid red';

        slotElement.innerHTML = ''; // Limpa o slot
        console.log(`%c[DEBUG RENDER] Slot ${slotElement.id} limpo.`, 'color: yellowgreen;');

        // Cria o novo elemento da carta para ser inserido
        const newCardElement = card.render(false, true, 
            this.selectedAttacker && this.selectedAttacker.id === card.id, 
            this.selectedTarget && this.selectedTarget.id === card.id);

        slotElement.appendChild(newCardElement); // Insere o novo HTML da carta
        console.log(`%c[DEBUG RENDER] Novo elemento da carta ${card.name} inserido no slot ${slotElement.id}.`, 'color: #00ff00; font-weight: bold;');

        // REMOVIDO: setTimeout para limpar estilo
    } else {
        console.error(`%c[DEBUG RENDER] ERRO: Slot n\u00e3o encontrado para re-renderizar a carta: ${card.name} (Owner: ${card.owner}, Pos: ${card.position})`, 'color: red; background-color: yellow;');
    }
},

    clearSelections: function() {
        if (this.selectedAttacker) {
            const attackerElement = document.getElementById(`card-${this.selectedAttacker.id}`);
            if (attackerElement) {
                attackerElement.classList.remove('selected');
                attackerElement.style.transform = 'none'; 
                attackerElement.style.zIndex = 'auto';
            }
        }
        if (this.selectedTarget) {
            const targetElement = document.getElementById(`card-${this.selectedTarget.id}`);
            if (targetElement) {
                targetElement.classList.remove('target-selected');
                targetElement.style.transform = 'none'; 
                targetElement.style.zIndex = 'auto';
            }
        }

        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.attackButton.classList.add('hidden');
        this.healButton.classList.add('hidden');
    },

    endTurn: function() {
        if (this.players.player1.team.filter(c => c.currentLife > 0).length === 0) {
            this.endGame(this.players.player2.name);
            return;
        }
        if (this.players.player2.team.filter(c => c.currentLife > 0).length === 0) {
            this.endGame(this.players.player1.name);
            return;
        }

        this.currentPlayerId = this.getOpponent(this.currentPlayerId);
        this.battleTurn++; 
        this.startTurn(); 
    },

    getOpponent: function(playerId) {
        return playerId === 'player1' ? 'player2' : 'player1';
    },

    getCardById: function(cardId) {
        for (const playerId in this.players) {
            const card = this.players[playerId].team.find(c => c.id === cardId);
            if (card) return card;
        }
        const foundInAllCards = allCards.find(c => c.id === cardId);
        if (foundInAllCards) {
            return new Card(foundInAllCards.id, foundInAllCards.name, foundInAllCards.type, [foundInAllCards.attackMin, foundInAllCards.attackMax],
                            foundInAllCards.maxLife, foundInAllCards.element, foundInAllCards.effectDescription, foundInAllCards.specialEffect);
        }
        return null;
    },

    getPlayersCards: function(playerId) {
        return this.players[playerId].team.filter(c => c.currentLife > 0);
    },

    getBattlefieldSlot: function(playerId, position) {
        const prefix = playerId === 'player1' ? 'p1_' : 'p2_';
        return document.getElementById(`${prefix}${position}`);
    },

    removeCardFromBattlefield: function(card) {
        const playerTeam = this.players[card.owner].team;
        const index = playerTeam.findIndex(c => c.id === card.id);
        if (index > -1) {
            playerTeam.splice(index, 1);
        }
    },

    playerDefeatedCard: function(card) {
        this.players[card.owner].defeatedCards.push(card);
    },

    forfeitGame: function() {
        const message = "Tem certeza que deseja desistir? Isso encerrará o jogo.";
        if (confirm(message)) {
            const winningPlayerId = this.getOpponent(this.currentPlayerId);
            this.endGame(this.players[winningPlayerId].name);
        }
    },

    endGame: function(winnerName) {
        this.victoryMessageElem.textContent = `${winnerName} venceu a Guerra de Monstros!`;
        this.addLog(`FIM DE JOGO! ${winnerName} é o vencedor!`);
        this.showScreen('gameOverScreen');
    },

    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    shineCard: function(cardElement) {
        if (cardElement) {
            cardElement.classList.add('shine');
            setTimeout(() => {
                cardElement.classList.remove('shine');
            }, 800); 
        }
    },
    shuffleArray: shuffleArray, // Importado de utils.js

    openCardDetailModal: function(card) {
        const originalCardData = allCards.find(c => c.id === card.id);
        if (!originalCardData) {
            console.error(`Original card data not found for ID: ${card.id}`);
            return;
        }

        this.modalCardImageElem.innerHTML = `<img src="img/${originalCardData.id}.png" onerror="this.onerror=null; this.src='https://placehold.co/120x90/4a5568/a0aec0?text=Sem+Img';" alt="${originalCardData.name}" class="w-full h-full object-cover">`;
        this.modalCardNameElem.textContent = originalCardData.name;
        this.modalCardClassElem.textContent = `${originalCardData.type} | ${originalCardData.element}`;
        this.modalCardStatsElem.textContent = `ATK: ${originalCardData.attackMin}-${originalCardData.attackMax} | VIDA: ${originalCardData.maxLife}`;
        this.modalCardElementElem.textContent = `Elemento: ${originalCardData.element}`;
        
        let modalEffectText = originalCardData.effectDescription;
        const colorMap = {
            'Fogo:': '#ef4444', 'Agua:': '#3b82f6', 'Terra:': '#a16207', 
            'Ar:': '#e2e8f0', 'Dark:': '#171717', 'Luz:': '#fbbf24' 
        };
        Object.keys(colorMap).forEach(prefix => {
            if (modalEffectText.includes(prefix)) {
                modalEffectText = modalEffectText.replace(
                    prefix,  
                    `<span style="color: ${colorMap[prefix]}; font-weight: bold;">${prefix}</span>`
                );
            }
        });
        this.modalCardEffectElem.innerHTML = modalEffectText;

        this.cardDetailModalElem.classList.remove('hidden');
    },

    closeCardDetailModal: function() {
        this.cardDetailModalElem.classList.add('hidden');
    },

    // Novas mecanicas

summonIgris: function(defeatedCard) {
    console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Tentando invocar Igris para ${defeatedCard.name}.`, 'color: #8a2be2;');

    try { 
        const sungJinWooCard = this.players[defeatedCard.owner].team.find(c => c.id === 'dark5' && c.currentLife > 0);

        if (sungJinWooCard && !sungJinWooCard.hasUsedSpecialAbilityOnce) {
            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Sung Jin-woo (%c${sungJinWooCard.name}%c) ativo e habilidade n\u00e3o usada.`, 'color: #8a2be2;', 'color: yellow;', 'color: #8a2be2;');

            // Cria uma nova instância da carta Igris (agora 'igrisCardData' é acessível)
            const Igris = new Card(
                igrisCardData.id, // Não tem 'game.' na frente agora
                igrisCardData.name,
                igrisCardData.type,
                igrisCardData.attackRange,
                igrisCardData.maxLife,
                igrisCardData.element,
                igrisCardData.effectDescription,
                igrisCardData.specialEffect
            );
            Igris.owner = defeatedCard.owner;
            Igris.position = defeatedCard.position; 

            // A defeatedCard já foi removida do array 'team' em dealDamage

            this.players[defeatedCard.owner].team.push(Igris); // Adiciona Igris ao time
            sungJinWooCard.hasUsedSpecialAbilityOnce = true; // Marca a habilidade de Sung Jin-woo como usada

            this.addLog(`${sungJinWooCard.name} (Dark) invocou ${Igris.name} no lugar de ${defeatedCard.name}!`);
            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] ${Igris.name} invocado!`, 'color: #00ff00; font-weight: bold;');
            this.reRenderCard(Igris); // Re-renderiza a carta Igris na posição
            this.updateUI(); // Atualiza a UI geral
            return true; 
        } else {
            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Sung Jin-woo n\u00e3o ativo ou habilidade j\u00e1 usada.`, 'color: #ff00ff;'); 
        }
        return false;
    } catch (error) {
        console.error(`%c[ERRO SUNG JIN-WOO INVOCAÇÃO] Erro inesperado:`, 'color: white; background-color: red; padding: 5px;', error);
        this.addLog(`ERRO na invoca\u00e7\u00e3o do Sung Jin-woo: ${error.message}`);
        return false;
    }
},

// js/game.js - SUBSTITUA A FUNÇÃO summonMagoNegro INTEIRA E COMPLETA

summonMagoNegro: async function(defeatedCard) { // Adicione 'async' aqui, se ainda não estiver
    console.log(`%c[DEBUG YUGI - SUMMON] Tentando invocar Mago Negro para ${defeatedCard.name}.`, 'color: #008080;'); // Teal

    try { 
        const yugiCard = this.players[defeatedCard.owner].team.find(c => (c.id === 'light6' || c.id === 'yami_yugi') && c.currentLife > 0);

        if (yugiCard && !yugiCard.hasUsedSummonAbilityOnce) {
            console.log(`%c[DEBUG YUGI - SUMMON] Yugi (%c${yugiCard.name}%c) ativo e habilidade de invoca\u00e7\u00e3o n\u00e3o usada.`, 'color: #008080;', 'color: yellow;', 'color: #008080;');

            // >>> ESTE É O CÓDIGO DE CRIAÇÃO DO MAGO NEGRO QUE ESTAVA FALTANDO <<<
            const MagoNegro = new Card(
                magoNegroCardData.id,
                magoNegroCardData.name,
                magoNegroCardData.type,
                magoNegroCardData.attackRange,
                magoNegroCardData.maxLife,
                magoNegroCardData.element,
                magoNegroCardData.effectDescription,
                magoNegroCardData.specialEffect
            );
            MagoNegro.owner = defeatedCard.owner;
            MagoNegro.position = defeatedCard.position; // Mago Negro ocupa a posição da carta derrotada

            // Adiciona Mago Negro ao time
            this.players[defeatedCard.owner].team.push(MagoNegro); 
            // >>> FIM DO CÓDIGO DE CRIAÇÃO <<<

            yugiCard.hasUsedSummonAbilityOnce = true; // Marca a habilidade de Yugi como usada

            this.addLog(`${yugiCard.name} invocou o ${MagoNegro.name} no lugar de ${defeatedCard.name}!`);
            console.log(`%c[DEBUG YUGI - SUMMON] ${MagoNegro.name} invocado!`, 'color: #00ff00; font-weight: bold;');

            this.reRenderCard(MagoNegro); // Re-renderiza a carta Mago Negro na posição

            // Ativa o efeito on-summon do Mago Negro imediatamente aqui
            if (MagoNegro.specialEffect) {
                await MagoNegro.specialEffect(this, MagoNegro, null); 
            }

            this.updateUI(); 
            return true; 
        } else {
            console.log(`%c[DEBUG YUGI - SUMMON] Yugi n\u00e3o ativo ou habilidade de invoca\u00e7\u00e3o j\u00e1 usada.`, 'color: #ff00ff;'); 
        }
        return false;
    } catch (error) {
        console.error(`%c[ERRO MAGO NEGRO INVOCA\u00c7\u00c3O] Erro inesperado:`, 'color: white; background-color: red; padding: 5px;', error);
        this.addLog(`ERRO na invoca\u00e7\u00e3o do Mago Negro: ${error.message}`);
        return false;
    }
},

};