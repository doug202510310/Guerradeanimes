// js/game.js

import { Card, allCards, igrisCardData, magoNegroCardData, gonAdultoCardData, mahoragaCardData, kiluaGodspeedCardData, sasukeRinneganCardData, allMightCardData} from './card.js';
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
    sasukeAmaterasuSound: null,
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
        this.draftSound.volume = 0.1;
        this.attackSound = new Audio('audio/attack.mp3'); 
        this.attackSound.volume = 0.7;
        this.healSound = new Audio('audio/heal.mp3'); 
        this.healSound.volume = 0.5;
        this.turnTransitionSound = new Audio('audio/turn_transition.mp3'); 
        this.turnTransitionSound.volume = 0.4;
        this.transformationSound = new Audio('audio/generic_transformation.mp3'); // Você precisará criar este arquivo de áudio
        this.transformationSound.volume = 0.6;
        this.transformationSound.playbackRate = 1.2; // Ajuste a velocidade de reprodução se necessário
        this.sukunaSound = new Audio('audio/Sukuna.mp3');
        this.sukunaSound.volume = 0.4;
        this.sukunaSound.playbackRate = 1.2; // Ajuste a velocidade de reprodução se necessário
        this.escanorSound = new Audio('audio/Escanor.mp3'); // <--- ADICIONE ESTA LINHA para Escanor
        this.escanorSound.volume = 0.7; // Ajuste o volume conforme desejar
        this.gonTransformSound = new Audio('audio/GonTransform.mp4');
        this.gonTransformSound.volume = 1.0; // Ajuste o volume conforme desejar
        this.mahoragaSound = new Audio('audio/mahoragaSound.mp3'); // <--- NOVO: Som do Mahoraga
        this.mahoragaSound.volume = 0.9; // Mahoraga merece um som alto!
         this.sasukeAmaterasuSound = new Audio('audio/amaterasu.mp3'); // Você precisará criar este arquivo de áudio
        this.sasukeAmaterasuSound.volume = 0.4;
        this.sasukeAmaterasuSound.playbackRate = 1.2;
         this.shinraTenseiSound = new Audio('audio/shinra_tensei.mp3'); // <--- ADICIONE ESTA LINHA
        this.shinraTenseiSound.volume = 0.4; // Ajuste o volume como desejar
        this.allMightTransformSound = new Audio('audio/all_might_transform.mp3');
        this.allMightTransformSound.volume = 0.7;
        this.yugiFaraoTransformSound = new Audio('audio/transformation_farao.mp3'); // <--- NOVO
        this.yugiFaraoTransformSound.volume = 0.7;
    

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
         if (card.id === 'fire6' && card.specialEffect) {
        await card.specialEffect(this, card, null); // Chama o specialEffect de Benimaru
    }
        
        // Toph's shield (earth2)
        if (card.id === 'earth2' && card.specialEffect) {
            await card.specialEffect(this, card, null); 
        }
    },

      handleCardClick: async function(cardId) {
    const clickedCard = this.getCardById(cardId);

    // 1. Validação inicial da carta clicada
    if (!clickedCard || clickedCard.currentLife <= 0) {
        this.addLog("Esta carta está derrotada ou não é válida. Selecione uma carta viva.");
        this.clearSelections(); // Sempre limpa se a seleção é inválida
        console.log(`%c[DEBUG CLICK] Carta inválida: ${clickedCard ? clickedCard.name : 'N/A'}, Vida: ${clickedCard ? clickedCard.currentLife : 'N/A'}`, 'color: orange;');
        return;
    }

    console.log(`%c[DEBUG CLICK] Clicou em: ${clickedCard.name} (ID: ${clickedCard.id}, Dono: ${clickedCard.owner})`, 'color: cyan;');

    // 2. Lógica de seleção de ATACANTE
    if (!this.selectedAttacker) {
        // Verifica se é uma carta do jogador atual e se ela pode agir
        const isOwner = clickedCard.owner === this.currentPlayerId;
        const hasNotActed = !clickedCard.hasAttackedThisTurn;
        const canPerformAction = clickedCard.canAttack; // 'canAttack' controla efeitos como Amaldiçoar

        if (isOwner && hasNotActed && canPerformAction) {
            this.selectedAttacker = clickedCard;
            this.addLog(`Você selecionou ${clickedCard.name} para agir.`);
            this.updateUI(); // Renderiza para destacar o atacante selecionado

            // Esconde os botões por padrão, eles só aparecerão se um alvo válido for selecionado
            this.attackButton.classList.add('hidden');
            this.healButton.classList.add('hidden');

            console.log(`%c[DEBUG CLICK] ${clickedCard.name} selecionado como atacante.`, 'color: lightgreen;');
            return; // Sai da função após selecionar o atacante
        } else {
            // Se a carta clicada não pode ser um atacante (não é do dono, já agiu, etc.)
            if (!isOwner) {
                this.addLog("Você deve selecionar uma de suas próprias cartas para agir.");
            } else if (!hasNotActed) {
                this.addLog("Esta carta já agiu neste turno.");
            } else if (!canPerformAction) {
                this.addLog("Esta carta está sob um efeito que impede sua ação.");
            }
            this.clearSelections(); // Limpa qualquer seleção anterior
            console.log(`%c[DEBUG CLICK] ${clickedCard.name} não pode ser selecionado como atacante.`, 'color: darkred;');
            return;
        }
    }

    // 3. Lógica de seleção de ALVO (se já temos um atacante selecionado)
    console.log(`%c[DEBUG CLICK] Atacante já selecionado: ${this.selectedAttacker.name}. Tentando selecionar alvo: ${clickedCard.name}.`, 'color: cyan;');

    // Resetar botões antes de reavaliar
    this.attackButton.classList.add('hidden');
    this.healButton.classList.add('hidden');

    // Clicou no próprio atacante novamente: deseleciona
    if (this.selectedAttacker.id === clickedCard.id) {
        this.addLog(`Deselecionou ${clickedCard.name}.`);
        this.clearSelections();
        return;
    }

    // 3.1. Alvo ALIADO (para cura ou habilidades em aliados)
    if (this.selectedAttacker.owner === clickedCard.owner) {
        // Verifica se o atacante é um Healer ou Rengoku (que tem uma ação de "cura")
        // NOTE: Feiticeiros não tem ação de "clicar para curar"
        if (this.selectedAttacker.type === 'Healer' || this.selectedAttacker.id === 'fire5') {
            // Lógica específica para Julius Novachrono (light5)
            if (this.selectedAttacker.id === 'light5' && this.selectedAttacker.hasUsedSpecialAbilityOnce) {
                this.addLog(`${this.selectedAttacker.name} já usou sua habilidade especial neste jogo.`);
                this.clearSelections();
                return;
            }
            // Não pode curar/purificar alvo com vida cheia e sem debuffs (se for Julius)
            if (this.selectedAttacker.id === 'light5') { // Apenas Julius tem essa condição extra
                 const hasNegativeEffects = Object.keys(clickedCard.effectsApplied).some(effectName =>
                     ['Amaldiçoar', 'Queimar', 'Enraizar', 'Atordoar', 'Partitura'].includes(effectName) // Adicionado Partitura aqui
                 );
                if (clickedCard.currentLife >= clickedCard.maxLife && !hasNegativeEffects) {
                    this.addLog(`${clickedCard.name} já tem vida máxima e nenhum efeito negativo para ${this.selectedAttacker.name} purificar.`);
                    this.clearSelections();
                    return;
                }
            }


            this.selectedTarget = clickedCard;
            this.addLog(`Você selecionou ${clickedCard.name} como alvo de cura/habilidade.`);
            this.healButton.classList.remove('hidden'); // Mostra o botão de CURAR
            console.log(`%c[DEBUG BUTTONS] Alvo aliado válido para cura.`, 'color: #00ff00;');
        } else {
            this.addLog("Esta carta não pode curar aliados.");
            this.clearSelections();
            console.log(`%c[DEBUG BUTTONS] Carta de Dano/Tank clicou em aliado, deselecionado.`, 'color: yellow;');
        }
    }
    // 3.2. Alvo INIMIGO (para ataque)
    else {
        // Verifica se o atacante pode atacar inimigos (qualquer tipo que não seja "Healer" puro)
        // Ou se é um Healer com exceção (Rengoku, Merlin tem ação especial, mas aqui é ataque)
        const canAttackerTargetEnemy = (this.selectedAttacker.type !== 'Healer' || this.selectedAttacker.id === 'fire5' || this.selectedAttacker.id === 'dark6' || this.selectedAttacker.type === 'Feiticeiro'); // Inclui Feiticeiros aqui se eles puderem "atacar" por clique (no seu caso, eles não atacam, mas mantive o check)

        if (!canAttackerTargetEnemy) {
            this.addLog("Esta carta não pode atacar inimigos.");
            this.clearSelections();
            console.log(`%c[DEBUG BUTTONS] Healer padrão clicou em inimigo, deselecionado.`, 'color: yellow;');
            return;
        }

        // Regra do Tank (se houver Tank vivo na frente, ele deve ser o alvo, a menos que o atacante ignore Tanks)
        const opponentFrontRow = this.players[this.getOpponent(this.currentPlayerId)].team.filter(c => c.currentLife > 0 && (c.position === 'pos1' || c.position === 'pos2'));
        const canIgnoreTanks = (this.selectedAttacker.id === 'water4' || this.selectedAttacker.id === 'dark4' || this.selectedAttacker.id === 'light4'); // Tomioka, Itachi, Kakashi

        let isValidTargetForAttack = false;

        if (opponentFrontRow.length > 0) { // Se há Tanks ou cards na linha de frente
            if (canIgnoreTanks) {
                isValidTargetForAttack = true; // Atacante ignora Tanks, qualquer inimigo vivo é válido
                this.addLog(`${this.selectedAttacker.name} ignora a linha de frente.`);
            } else if (clickedCard.position === 'pos1' || clickedCard.position === 'pos2') {
                // Atacante não ignora Tanks, e o alvo clicado está na frente
                isValidTargetForAttack = true;
            } else {
                // Atacante não ignora Tanks, e o alvo clicado está na traseira, mas há cartas na frente
                this.addLog("Você deve atacar as cartas da frente (Tanks ou outros) primeiro.");
                this.clearSelections();
                return;
            }
        } else {
            // Não há cartas na linha de frente, qualquer inimigo vivo é válido
            isValidTargetForAttack = true;
        }

        if (isValidTargetForAttack && clickedCard.currentLife > 0) {
            this.selectedTarget = clickedCard;
            this.addLog(`Você selecionou ${clickedCard.name} como alvo.`);
            this.attackButton.classList.remove('hidden'); // Mostra o botão de ATACAR
            console.log(`%c[DEBUG BUTTONS] Alvo inimigo válido para ataque.`, 'color: #00ff00;');
        } else {
            this.addLog("O alvo selecionado já está derrotado ou não é um alvo válido.");
            this.clearSelections();
            console.log(`%c[DEBUG BUTTONS] Alvo derrotado ou inválido, deselecionado.`, 'color: yellow;');
        }
    }
    this.updateUI(); // Garante que a UI esteja atualizada com a seleção do alvo
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
    this.isProcessingAttack = true;
    if (!isSecondHit) {
        this.attackSound.play();
        this.currentDamageDealt = 0;
        this.attackCountForPlayer[attacker.owner]++;

        // --- LÓGICA DO EFEITO PASSIVO DE DRENO DE MEGUMI (dark8) ---
        // Ativa APENAS UMA VEZ por ataque principal (se não for o segundo hit do Toji)
        const megumiPlayer1 = this.players.player1.team.find(c => c.id === 'dark8' && c.currentLife > 0);
        const megumiPlayer2 = this.players.player2.team.find(c => c.id === 'dark8' && c.currentLife > 0);

        if (megumiPlayer1 && megumiPlayer1.specialEffect) {
            await megumiPlayer1.specialEffect(this, megumiPlayer1, null);
        }
        if (megumiPlayer2 && megumiPlayer2.specialEffect) {
            await megumiPlayer2.specialEffect(this, megumiPlayer2, null);
        }
    }

    // 2. Animação do Atacante
    const attackerElement = document.getElementById(`card-${attacker.id}`);
    if (attackerElement) {
        attackerElement.style.animation = 'attack-move 0.3s ease-out forwards';
        await this.sleep(300);
    }

    // 3. Cálculo do Dano Base
    let rawDamage = Math.floor(Math.random() * (attacker.attackMax + attacker.tempAttackBonus - (attacker.attackMin + attacker.tempAttackBonus) + 1)) + (attacker.attackMin + attacker.tempAttackBonus);
    let finalDamage = rawDamage;

    // 4. Habilidades Específicas do ATACANTE que MODIFICAM O DANO OU ATAQUE
    let gojoDoubleDamage = false;
    if (attacker.id === 'light3' && attacker.specialEffect) {
        const result = await attacker.specialEffect(this, attacker, target);
        if (result === 2) {
            finalDamage *= 2;
            gojoDoubleDamage = true;
        }
    }

    let tobiramaBonus = 0;
    if (attacker.id === 'water3' && attacker.specialEffect) {
        tobiramaBonus = await attacker.specialEffect(this, attacker, target);
        finalDamage += tobiramaBonus;
    }

    let ignoredShieldAmount = 0;
    if (attacker.id === 'earth4' && attacker.specialEffect) {
        ignoredShieldAmount = await attacker.specialEffect(this, attacker, target);
    }

    // 5. Multiplicador Elemental (se Gojo não dobrou o dano)
    let elementalMultiplier = 1;
    if (!gojoDoubleDamage) {
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

    // 6. Dano Extra da Partitura (Efeito no ALVO)
    if (target.effectsApplied['Partitura']) {
        const extraDamage = target.effectsApplied['Partitura'].value;
        finalDamage += extraDamage;
        this.addLog(`${target.name} sofreu ${extraDamage} de dano extra devido à Partitura!`);
        console.log(`%c[DEBUG UZUI - PARTITURA] ${target.name} recebeu ${extraDamage} de dano extra da Partitura.`, 'color: #00BFFF;');
    }
    
    this.currentDamageDealt = finalDamage;

    // 7. Aplicar Dano ao Alvo (Função dealDamage lida com Escudo, Esquiva, Redução do alvo)
    await this.dealDamage(target, finalDamage, attacker);

    // 8. Efeitos Pós-Dano no ALVO (reações do ALVO ao receber dano)
    if (!isSecondHit) {
        if (target.id === 'water1' && target.specialEffect) { // Blastoise
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'water2' && target.specialEffect) { // Kisame
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'earth3' && target.specialEffect) { // Edward Elric
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'dark2' && target.specialEffect) { // Zeref
            await target.specialEffect(this, target, target);
        }
        if (target.id === 'wind2' && target.specialEffect) { // Aang
            await target.specialEffect(this, target, target);
        }
    }
    
    // 9. Efeitos Pós-Ataque do ATACANTE (habilidades que ativam APÓS o ataque)
    if (!isSecondHit) {
        if (attacker.id === 'fire4' && attacker.specialEffect) { // Roy Mustang
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'fire5' && attacker.specialEffect) { // Rengoku
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'wind4' && attacker.specialEffect) { // Minato
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'wind3' && attacker.specialEffect && !this.isTojiSecondHit) { // Toji (Ataque Duplo)
            this.isTojiSecondHit = true;
            await this.performAttack(attacker, target, true);
            this.isTojiSecondHit = false;
        }
        if (attacker.id === 'wind6' && attacker.specialEffect) { // Zoro
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'light7' && attacker.specialEffect) { // Goku (Kamehameha)
            await attacker.specialEffect(this, attacker, target);
        }
        if (attacker.id === 'earth8' && attacker.specialEffect) { // Pain (Shinra Tensei)
            await attacker.specialEffect(this, attacker, target);
        }
        // --- ATIVAÇÃO DE ESCANOR E SUKUNA (ATAQUE CONJUNTO) ---
        const potentialJointAttackers = this.getPlayersCards(attacker.owner).filter(c => 
            c.currentLife > 0 &&         // A carta está viva
            c.id !== attacker.id &&      // Não é o atacante principal
            !c.hasAttackedThisTurn &&    // Não atacou junto ainda neste turno
            (c.id === 'fire1' || c.id === 'dark7' || c.id === 'fire8') // É Escanor, Sukuna, Sasuke
        );

        for (const jointAttacker of potentialJointAttackers) {
            if (jointAttacker.specialEffect) {
                const hasAttackedJointly = await jointAttacker.specialEffect(this, jointAttacker, target);
                if (hasAttackedJointly) {
                    jointAttacker.hasAttackedThisTurn = true;
                    if (jointAttacker.id === 'fire8' && this.sasukeAmaterasuSound) {
                        this.sasukeAmaterasuSound.play();
                    }
                }
            }
        }
        // --- FIM DA ATIVAÇÃO DE ESCANOR, SUKUNA E SASUKE ---
    }
    // Habilidade de Sasuke Rinnegan que ataca todos os inimigos (sempre ativa no ataque dele)
    if (attacker.id === 'sasuke_rinnegan' && attacker.specialEffect) {
        await attacker.specialEffect(this, attacker, target);
    }

    // 10. Finalização da Animação e Limpeza
    if (attackerElement) { attackerElement.style.animation = ''; }
    this.isProcessingAttack = false;
},
    performHeal: async function(healer, target) {
          this.isProcessingHeal = true;
    this.healSound.play();

    const healerElement = document.getElementById(`card-${healer.id}`);
    if (healerElement) {
        healerElement.style.animation = 'attack-move 0.3s ease-out forwards';
        await this.sleep(300);
    }

    let healAmount = Math.floor(Math.random() * (healer.attackMax - healer.attackMin + 1)) + healer.attackMin;

    if (healer.id === 'water5' && healer.specialEffect) { // Noelle
        healAmount += await healer.specialEffect(this, healer, target);
    }
            
    // Aplica a cura ao alvo primeiro
    this.healCard(target, healAmount);
    this.addLog(`${healer.name} curou ${healAmount} de vida de ${target.name}. Vida: ${target.currentLife}`);

    // Habilidades de Healers que ativam APÓS a cura
    if (healer.id === 'wind5' && healer.specialEffect) { // Akali (Ar) - Concede EsquivaChance
        await healer.specialEffect(this, healer, target);
    }
    
    if (healer.id === 'wind7' && healer.specialEffect) { // <--- NOVO: Meimei (Ar) - Causa dano em área
        await healer.specialEffect(this, healer, target);
    }

    if (healer.id === 'light5' && healer.specialEffect) { // Julius Novachrono (Luz) - Purifica e cura
        await healer.specialEffect(this, healer, target);
    }
    if (healer.id === 'dark5' && healer.specialEffect) {
        // Sung Jin-woo (Dark): Sua habilidade de BUFF TANK já é ativada em startBattlePhase.
        // Sua habilidade de invocação de Igris é ativada em dealDamage quando um aliado morre.
        // Se houver algum outro specialEffect de Sung Jin-woo que ative na cura, ele viria aqui.
        // No momento, o specialEffect de Sung Jin-woo no card.js NÃO espera ser chamado por performHeal.
        // Verifique se você realmente quer chamar o specialEffect dele aqui.
        // Se a lógica do specialEffect do dark5 que está no card.js é APENAS para buffar o tank no início da batalha,
        // então essa linha aqui (healer.id === 'dark5' && healer.specialEffect) pode ser REMOVIDA.
        // A menos que você tenha adicionado uma nova função de specialEffect para ele que ative na cura.
        // Pelo que vi no card.js, o specialEffect do Sung Jin-woo é apenas para o BUFF INICIAL NO TANK.
        // Então, essa linha provavelmente deve ser removida.
        // await healer.specialEffect(this, healer, target); // <-- REMOVA OU COMENTE ESTA LINHA SE O specialEffect DO SUNG JIN-WOO NÃO FOR DE CURA
    }

    // Animação do alvo (recebendo cura)
    const targetElement = document.getElementById(`card-${target.id}`);
    if (targetElement) {
        targetElement.style.animation = 'target-heal 0.6s ease-out';
        await this.sleep(600);
        targetElement.style.animation = '';
    }

    // Limpa a animação do curandeiro
    if (healerElement) {
        healerElement.style.animation = '';
    }

    this.isProcessingHeal = false;
},

// Dentro do objeto 'game' no seu arquivo game.js

  // game.js

// ... (todo o seu código anterior)

 dealDamage: async function(targetCard, amount, attacker = null) {
    let damageToApply = amount;
    let finalDamageReceived = 0;
    // Esta flag controla se a carta foi "resolvida" (regenerada, transformada, invocada)
    // e não precisa mais da lógica padrão de "derrotado" no slot DOM.
    let handledByTransformationOrSummon = false; 

    console.log(`%c[DEBUG DEALDAMAGE START] --- Processando Dano ---`, 'background-color: #333; color: white; padding: 2px 5px;');
    console.log(`%c[DEBUG DEALDAMAGE START] Alvo: ${targetCard.name} (HP: ${targetCard.currentLife}/${targetCard.maxLife}), Dano Inicial: ${damageToApply}, Atacante: ${attacker ? attacker.name : 'N/A'}.`, 'color: #ADD8E6;');

    // 0. LÓGICA DE REDIRECIONAMENTO DE DANO PARA BAN (water7)
    const banCard = this.players[targetCard.owner].team.find(c => c.id === 'water7' && c.currentLife > 0);
    if (targetCard.id !== 'water7' && targetCard.owner === banCard?.owner && banCard && !banCard.hasUsedSpecialAbilityOnce) {
        this.addLog(`${banCard.name} (Agua) se interpõe e sofre o dano no lugar de ${targetCard.name}!`);
        await this.dealDamage(banCard, damageToApply, attacker);
        this.reRenderCard(targetCard);
        this.updateUI();
        console.log(`%c[DEBUG DEALDAMAGE END] Dano redirecionado por Ban. Finalizando esta execução de dealDamage.`, 'color: #ADD8E6;');
        return;
    }

    // 1. ANIMAÇÃO DE DANO RECEBIDO
    const currentTargetElement = document.getElementById(`card-${targetCard.id}`);
    if (currentTargetElement && damageToApply > 0) {
        currentTargetElement.style.animation = 'target-hit 0.6s ease-out';
        await this.sleep(600);
        currentTargetElement.style.animation = '';
    }

    // 2. EFEITOS DE DEFESA DO ALVO QUE REDUZEM OU ANULAM DANO
    // 2.1. Obito (wind1): 35% de chance de esquivar COMPLETAMENTE
    if (targetCard.id === 'wind1' && targetCard.specialEffect && targetCard.currentLife > 0) {
        const obitoDodged = await targetCard.specialEffect(this, targetCard, targetCard);
        if (obitoDodged) {
            this.addLog(`${targetCard.name} (Vento) esquivou completamente do ataque!`);
            damageToApply = 0;
            this.reRenderCard(targetCard);
            this.updateUI();
            console.log(`%c[DEBUG DEALDAMAGE END] Obito esquivou, dano zerado.`, 'color: #ADD8E6;');
            return;
        }
    }
    // 2.2. EsquivaChance (Akali - wind5): Ignorado por Kakashi. Se não é Kakashi, chance de esquivar.
    // Kilua Godspeed (kilua_godspeed) também tem essa passiva
    if (targetCard.currentLife > 0 && (targetCard.effectsApplied['EsquivaChance'] || targetCard.id === 'kilua_godspeed') && (attacker === null || attacker.id !== 'light4')) {
        let dodgeChance = 0;
        if (targetCard.effectsApplied['EsquivaChance']) {
            dodgeChance = targetCard.effectsApplied['EsquivaChance'].value;
        } else if (targetCard.id === 'kilua_godspeed' && targetCard.specialEffect) {
            // Kilua Godspeed tem seu próprio specialEffect para esquiva
            const kiluaDodged = await targetCard.specialEffect(this, targetCard, targetCard);
            if (kiluaDodged) {
                this.addLog(`${targetCard.name} (Vento) esquivou do ataque devido à sua velocidade Godspeed!`);
                damageToApply = 0;
                this.reRenderCard(targetCard);
                this.updateUI();
                console.log(`%c[DEBUG DEALDAMAGE END] Kilua Godspeed esquivou, dano zerado.`, 'color: #ADD8E6;');
                return;
            }
        }

        if (dodgeChance > 0 && Math.random() < dodgeChance) {
            this.addLog(`${targetCard.name} esquivou do ataque devido ao efeito de Akali!`);
            damageToApply = 0;
            delete targetCard.effectsApplied['EsquivaChance'];
            this.reRenderCard(targetCard);
            this.updateUI();
            console.log(`%c[DEBUG DEALDAMAGE END] Akali esquivou, dano zerado.`, 'color: #ADD8E6;');
            return;
        }
    }

    // 2.3. Gaara (earth1): 50% de chance de reduzir 5 de dano
    if (targetCard.id === 'earth1' && targetCard.specialEffect && targetCard.currentLife > 0) {
        const gaaraReduction = await targetCard.specialEffect(this, targetCard, targetCard);
        if (gaaraReduction < 0) {
            damageToApply = Math.max(0, damageToApply + gaaraReduction);
            this.addLog(`${targetCard.name} (Terra) reduziu ${Math.abs(gaaraReduction)} de dano recebido!`);
        }
    }
    // 2.4. Hashirama (light1): 50% de chance de reduzir 5 de dano
    if (targetCard.id === 'light1' && targetCard.specialEffect && targetCard.currentLife > 0) {
        const hashiramaReduction = await targetCard.specialEffect(this, targetCard, targetCard);
        if (hashiramaReduction < 0) {
            damageToApply = Math.max(0, damageToApply + hashiramaReduction);
            this.addLog(`${targetCard.name} (Luz) reduziu ${Math.abs(hashiramaReduction)} de dano recebido!`);
        }
    }

    // 3. LÓGICA DO ESCUDO
    if (damageToApply > 0 && targetCard.effectsApplied['Escudo'] && targetCard.effectsApplied['Escudo'].value > 0 && (attacker === null || attacker.id !== 'light4')) {
        const shieldValue = targetCard.effectsApplied['Escudo'].value;
        let effectiveShield = shieldValue;
        if (attacker && attacker.id === 'earth4') { // Might Guy
            const ignoredShield = 10;
            effectiveShield = Math.max(0, shieldValue - ignoredShield);
            if (ignoredShield > 0 && effectiveShield < shieldValue) {
                this.addLog(`${attacker.name} (Terra) ignorou ${ignoredShield} de Escudo de ${targetCard.name}. Escudo efetivo: ${effectiveShield}.`);
            }
        }
        
        if (effectiveShield > 0) {
            const damageAbsorbedByShield = Math.min(damageToApply, effectiveShield);
            targetCard.effectsApplied['Escudo'].value -= damageAbsorbedByShield;
            damageToApply -= damageAbsorbedByShield;
            this.addLog(`${targetCard.name} absorveu ${damageAbsorbedByShield} de dano com seu escudo. Escudo restante: ${targetCard.effectsApplied['Escudo'].value}.`);
            if (targetCard.effectsApplied['Escudo'].value <= 0) {
                delete targetCard.effectsApplied['Escudo'];
                this.addLog(`O escudo de ${targetCard.name} foi quebrado!`);
            }
            this.reRenderCard(targetCard);
        }
    }

    // 4. APLICAÇÃO DO DANO RESTANTE NA VIDA DA CARTA
    const lifeBeforeDamage = targetCard.currentLife;
    targetCard.currentLife -= damageToApply;
    if (targetCard.currentLife < 0) targetCard.currentLife = 0;

    finalDamageReceived = lifeBeforeDamage - targetCard.currentLife;

    this.addLog(`${targetCard.name} recebeu ${finalDamageReceived} de dano na vida. Vida restante: ${targetCard.currentLife}`);
    // reRenderCard não é chamado aqui para evitar renderização intermediária de carta "morta" antes da transformação/remoção.

    // 5. EFEITOS DE CURA/REFORÇO DO ATACANTE BASEADO NO DANO CAUSADO (Ex: All Might)
    if (attacker && attacker.id === 'all_might' && attacker.specialEffect && finalDamageReceived > 0) {
        console.log(`%c[DEBUG ALL MIGHT DEALDAMAGE] All Might (${attacker.name}) causou ${finalDamageReceived} de dano a ${targetCard.name}. Ativando cura!`, 'color: #fbbf24;');
        const tempCurrentDamageDealt = this.currentDamageDealt;
        this.currentDamageDealt = finalDamageReceived;
        await attacker.specialEffect(this, attacker, targetCard);
        this.currentDamageDealt = tempCurrentDamageDealt;
        console.log(`%c[DEBUG ALL MIGHT DEALDAMAGE] All Might processou a cura. Sua vida: ${attacker.currentLife}/${attacker.maxLife}.`, 'color: #fbbf24;');
    }

    // 7. LÓGICA DE EXECUÇÃO E TRANSFORMAÇÃO DE KILUA (wind8)
    let wasExecutedByKilua = false;
    if (attacker && attacker.id === 'wind8' && finalDamageReceived > 0 && targetCard.currentLife > 0 && targetCard.currentLife <= 5) {
        const kiluaCardInTeam = this.players[attacker.owner].team.find(c => c.id === 'wind8');
        if (kiluaCardInTeam && !kiluaCardInTeam.hasUsedTransformationAbilityOnce) {
            this.addLog(`${attacker.name} (Vento) executa ${targetCard.name} com sua passiva de Assassino!`);
            targetCard.currentLife = 0;
            await this.transformKiluaToGodspeed(kiluaCardInTeam);
            wasExecutedByKilua = true;
            handledByTransformationOrSummon = true;
        } else {
            console.log(`%c[DEBUG KILUA] Kilua não executou (já transformou ou não é Kilua).`, 'color: grey;');
        }
    }

    // 8. EFEITOS PÓS-DANO NO ALVO (reações do ALVO ao receber dano na vida)
    if (!wasExecutedByKilua && targetCard.currentLife > 0 && finalDamageReceived > 0) {
        if (targetCard.id === 'earth6' && targetCard.specialEffect) { await targetCard.specialEffect(this, targetCard, null); } // Luffy
        if (targetCard.id === 'fire7' && targetCard.specialEffect) { await targetCard.specialEffect(this, targetCard, attacker); } // Vegeta
        if (targetCard.id === 'earth3' && targetCard.specialEffect) { await targetCard.specialEffect(this, targetCard, attacker); } // Edward Elric
        if (targetCard.id === 'dark2' && targetCard.specialEffect) { await targetCard.specialEffect(this, targetCard, attacker); } // Zeref
        if (targetCard.id === 'water2' && targetCard.specialEffect) { await targetCard.specialEffect(this, targetCard, attacker); } // Kisame
        if (targetCard.id === 'wind2' && targetCard.specialEffect) { await targetCard.specialEffect(this, targetCard, targetCard); } // Aang
    }

    // 9. VERIFICAÇÃO DE DERROTA E EFEITOS DE MORTE/INVOCAÇÕES/REGENERAÇÕES FINAIS
    if (targetCard.currentLife <= 0) {
        this.isCardDefeated = true; // Sinaliza que uma carta foi derrotada
        
        // Lógica de TRANSFORMAÇÃO DO GON (earth7) - Prioridade para transformar
        console.log(`%c[DEBUG DEALDAMAGE] Verificando transformação de Gon... targetCard: ${targetCard.name}, ID: ${targetCard.id}`, 'color: #DAA520;');
        if (targetCard.id === 'earth7' && !targetCard.hasUsedTransformationAbilityOnce) {
             console.log(`%c[DEBUG DEALDAMAGE] Condições para transformação de Gon atendidas. Chamando transformGonToAdult.`, 'color: #DAA520;');
             const transformed = await this.transformGonToAdult(targetCard);
             if (transformed) {
                 handledByTransformationOrSummon = true;
                 console.log(`%c[DEBUG DEALDAMAGE] Gon (criança) foi derrotado e transformado com sucesso. handledByTransformationOrSummon = true.`, 'color: green; font-weight: bold;');
             } else {
                 console.log(`%c[DEBUG DEALDAMAGE] transformGonToAdult retornou FALSE. Gon não transformou.`, 'color: red;');
             }
        } else {
            console.log(`%c[DEBUG DEALDAMAGE] Gon não se transformará. ID: ${targetCard.id}, Já usada: ${targetCard.hasUsedTransformationAbilityOnce}`, 'color: #DAA520;');
        }
        
        // Se a carta original foi derrotada E NÃO FOI TRATADA POR UMA TRANSFORMAÇÃO/INVOCAÇÃO ATÉ AQUI
        if (!handledByTransformationOrSummon) {
            // Lógica de REGENERAÇÃO DO BAN (water7)
            if (targetCard.id === 'water7' && targetCard.specialEffect && !targetCard.hasUsedSpecialAbilityOnce) {
                console.log(`%c[DEBUG BAN REGEN] Ban (${targetCard.name}) foi derrotado, ativando regenera\u00e7\u00e3o...`, 'color: #00BFFF;');
                const abilityActivated = await targetCard.specialEffect(this, targetCard, null);
                if (abilityActivated) {
                    this.addLog(`${targetCard.name} se regenerou completamente e permanece no campo!`);
                    handledByTransformationOrSummon = true;
                }
            }

            // Lógica de INVOCAÇÃO POR FEITICEIROS AO TER ALIADO DERROTADO
            if (!handledByTransformationOrSummon) {
                // Lógica de invocação de Mahoraga (por Megumi)
                const allRemainingPlayersCards = this.getPlayersCards(targetCard.owner);
                const megumiDying = (targetCard.id === 'dark8');

                if (megumiDying && allRemainingPlayersCards.length === 0 && !targetCard.hasUsedSpecialAbilityOnce) {
                    this.addLog(`${targetCard.name} (Dark) é o \u00fanico sobrevivente e foi derrotado! Ele se sacrifica para invocar o General Mahoraga!`);
                    await this.summonMahoraga(targetCard);
                    targetCard.hasUsedSpecialAbilityOnce = true;
                    handledByTransformationOrSummon = true;
                }

                // Prioridade: Yugi (Mago Negro)
                if (!handledByTransformationOrSummon) {
                    const yugiInTeam = this.players[targetCard.owner].team.find(c => (c.id === 'light6' || c.id === 'yami_yugi') && c.currentLife > 0);
                    if (yugiInTeam && !yugiInTeam.hasUsedSummonAbilityOnce) {
                        console.log(`%c[DEBUG DEALDAMAGE - INVOCAR] Yugi está presente. Tentando invocar Mago Negro.`, 'color: #008080;');
                        const summonedSuccessfully = await this.summonMagoNegro(targetCard);
                        if (summonedSuccessfully) {
                            handledByTransformationOrSummon = true;
                        }
                    }
                }

                // Sung Jin-woo (Igris)
                if (!handledByTransformationOrSummon) {
                    const sungJinWooInTeam = this.players[targetCard.owner].team.find(c => c.id === 'dark5' && c.currentLife > 0);
                    if (sungJinWooInTeam && !sungJinWooInTeam.hasUsedSpecialAbilityOnce) {
                        console.log(`%c[DEBUG DEALDAMAGE - INVOCAR] Sung Jin-woo está presente. Tentando invocar Igris.`, 'color: #008080;');
                        const summonedSuccessfully = await this.summonIgris(targetCard);
                        if (summonedSuccessfully) {
                            handledByTransformationOrSummon = true;
                        } else if (sungJinWooInTeam && sungJinWooInTeam.hasUsedSpecialAbilityOnce) {
                            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Sung Jin-woo j\u00e1 usou sua habilidade de invoca\u00e7\u00e3o.`, 'color: #ff00ff;');
                        }
                    }
                }
            }
        }
        
        // --- Processamento de Efeitos "On-Death" e Remoção Final ---

        // LÓGICA DO LEVI (water8) - Ativa quando QUALQUER ALIADO morre
        const leviInTeam = this.players[targetCard.owner].team.find(c => c.id === 'water8' && c.currentLife > 0);
        if (leviInTeam && leviInTeam.specialEffect && targetCard.owner === leviInTeam.owner) {
            console.log(`%c[DEBUG DEALDAMAGE - LEVI] Levi está presente no time de ${targetCard.owner} e ${targetCard.name} morreu. Ativando habilidade.`, 'color: #3b82f6;');
            await leviInTeam.specialEffect(this, leviInTeam, targetCard);
        }

        // EFEITOS DE MORTE DE OUTRAS CARTAS (ativam ao morrer)
        if (!handledByTransformationOrSummon) {
            if (targetCard.id === 'fire3' && targetCard.specialEffect) { // Deidara
                await targetCard.specialEffect(this, targetCard, targetCard);
            }
        }

        // REMOÇÃO VISUAL FINAL DA CARTA DERROTADA (COM OVERLAY "DERROTADO")
        // Este bloco SÓ deve executar se a carta NÃO foi regenerada, transformada ou invocada.
        if (!handledByTransformationOrSummon) {
            this.removeCardFromBattlefield(targetCard);
            this.playerDefeatedCard(targetCard);

            const slotOfDefeatedCard = this.getBattlefieldSlot(targetCard.owner, targetCard.position);
            if (slotOfDefeatedCard) {
                slotOfDefeatedCard.innerHTML = '';
                const defeatedOverlay = document.createElement('div');
                defeatedOverlay.classList.add('absolute', 'inset-0', 'bg-red-900', 'bg-opacity-70', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-xl', 'rounded-lg', 'text-white');
                defeatedOverlay.textContent = 'DERROTADO';
                slotOfDefeatedCard.appendChild(defeatedOverlay);
            }
            this.addLog(`${targetCard.name} foi removido do campo.`);
        }
        
        this.isCardDefeated = false;
    } else {
        // Se a carta não foi derrotada, apenas re-renderiza para atualizar vida/efeitos
        console.log(`%c[DEBUG DEALDAMAGE] Carta não derrotada. Re-renderizando ${targetCard.name}.`, 'color: #6A5ACD;');
        this.reRenderCard(targetCard);
    }

    // 10. ATUALIZAÇÃO FINAL DA UI
    this.updateUI();
    console.log(`%c[DEBUG DEALDAMAGE END] --- Fim do Processamento de Dano ---`, 'background-color: #333; color: white; padding: 2px 5px;');
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
    console.log(`%c[DEBUG RENDER] Tentando re-renderizar a carta: ${card.name} (ID: ${card.id}), Proprietário: ${card.owner}, Posição: ${card.position}`, 'color: yellowgreen; font-weight: bold;');
    console.log(`%c[DEBUG RENDER] Efeitos no momento da renderização para ${card.name}:`, 'color: yellowgreen;', card.effectsApplied);
    const slotElement = this.getBattlefieldSlot(card.owner, card.position);

    if (slotElement) {
        console.log(`%c[DEBUG RENDER] Slot DOM encontrado: ${slotElement.id}. Limpando...`, 'color: yellowgreen;');

        // Limpa o conteúdo anterior do slot
        slotElement.innerHTML = ''; 

        // Cria o novo elemento da carta
        const newCardElement = card.render(false, true,
            this.selectedAttacker && this.selectedAttacker.id === card.id,
            this.selectedTarget && this.selectedTarget.id === card.id);

        // Adiciona o novo elemento da carta ao slot
        slotElement.appendChild(newCardElement);
        console.log(`%c[DEBUG RENDER] Novo elemento de <span class="math-inline">\{card\.name\} \(</span>{card.id}) INSERIDO no slot ${slotElement.id}.`, 'color: #00ff00; font-weight: bold;');

    } else {
        // Este erro é CRÍTICO. Indica que a posição da carta não corresponde a um slot DOM válido.
        console.error(`%c[DEBUG RENDER] ERRO CRÍTICO: Slot DOM NÃO ENCONTRADO para re-renderizar a carta: ${card.name} (Owner: ${card.owner}, Pos: ${card.position}). A carta pode não aparecer no campo.`, 'color: white; background-color: red; padding: 5px;');
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

   endTurn: async function() {
        if (this.players.player1.team.filter(c => c.currentLife > 0).length === 0) {
            this.endGame(this.players.player2.name);
            return;
        }
        if (this.players.player2.team.filter(c => c.currentLife > 0).length === 0) {
            this.endGame(this.players.player1.name);
            return;
        }
           for (const playerId in this.players) {
        const currentPlayerCards = this.getPlayersCards(playerId);
        const megumiInTeam = currentPlayerCards.find(c => c.id === 'dark8');

        // Se Megumi está vivo no time, e ele é o único aliado vivo, e não usou a habilidade de invocação ainda.
        if (megumiInTeam && currentPlayerCards.length === 1 && !megumiInTeam.hasUsedSpecialAbilityOnce) {
            this.addLog(`${megumiInTeam.name} (Dark) é o \u00fanico sobrevivente! Ele se sacrifica para invocar o General Mahoraga!`);
            
            // Marca a habilidade de Megumi como usada para que ele não invoque de novo
            megumiInTeam.hasUsedSpecialAbilityOnce = true;

            // Remove Megumi do campo (sacrifício)
            const playerTeam = this.players[playerId].team;
            const indexInTeam = playerTeam.findIndex(c => c.id === megumiInTeam.id);
            if (indexInTeam > -1) {
                playerTeam.splice(indexInTeam, 1);
            }
            this.playerDefeatedCard(megumiInTeam); // Adiciona Megumi aos derrotados

            // Invoca Mahoraga na posição de Megumi
            await this.summonMahoraga(megumiInTeam); // megumiInTeam tem a posição para Mahoraga

            this.updateUI(); // Atualiza a UI para remover Megumi e mostrar Mahoraga
            // Não retorna aqui, pois o jogo precisa verificar o próximo turno.
        }
         // --- NOVO: LÓGICA DE TRANSFORMAÇÃO DO SASUKE (fire8) ---
         for (const playerId in this.players) {
            const currentPlayerCards = this.getPlayersCards(playerId);
            const sasukeCard = currentPlayerCards.find(c => c.id === 'fire8' && c.currentLife > 0);

            // Se Sasuke está vivo no time, e ele é o único aliado vivo, e não usou a habilidade de transformação ainda.
            if (sasukeCard && currentPlayerCards.length === 1 && !sasukeCard.hasUsedTransformationAbilityOnce) {
                this.addLog(`${sasukeCard.name} (Fogo) é o único sobrevivente! Ele recebe o Rinnegan e se transforma!`);
                
                await this.transformSasukeToRinnegan(sasukeCard);

                this.updateUI(); // Atualiza a UI para mostrar a transformação
                // Não retorna aqui, o turno deve continuar normalmente após a transformação
            }
        }
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

summonIgris: async function(defeatedCard) {
    console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Tentando invocar Igris para ${defeatedCard.name}.`, 'color: #8a2be2;');

    try {
        const sungJinWooCard = this.players[defeatedCard.owner].team.find(c => c.id === 'dark5' && c.currentLife > 0);

        if (sungJinWooCard && !sungJinWooCard.hasUsedSpecialAbilityOnce) {
            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Sung Jin-woo (%c${sungJinWooCard.name}%c) ativo e habilidade não usada.`, 'color: #8a2be2;', 'color: yellow;', 'color: #8a2be2;');

            const Igris = new Card(
                igrisCardData.id,
                igrisCardData.name,
                igrisCardData.type,
                igrisCardData.attackRange,
                igrisCardData.maxLife,
                igrisCardData.element,
                igrisCardData.effectDescription,
                igrisCardData.specialEffect
            );
            Igris.owner = defeatedCard.owner;
            Igris.position = defeatedCard.position; // Igris ocupa a posição da carta derrotada

            // Remove a carta derrotada do array 'team' ANTES de adicionar Igris.
            // Esta remoção aqui é NECESSÁRIA porque `dealDamage` só remove se !handledByTransformationOrSummon.
            // Para invocações, a carta derrotada PRECISA ser removida do array antes.
            this.removeCardFromBattlefield(defeatedCard); 

            this.players[defeatedCard.owner].team.push(Igris); // Adiciona Igris ao time
            sungJinWooCard.hasUsedSpecialAbilityOnce = true; // Marca a habilidade de Sung Jin-woo como usada

            this.addLog(`${sungJinWooCard.name} (Dark) invocou ${Igris.name} no lugar de ${defeatedCard.name}!`);
            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] ${Igris.name} invocado!`, 'color: #00ff00; font-weight: bold;');
            this.reRenderCard(Igris); // Re-renderiza a carta Igris na posição
            // Não chame updateUI aqui, será chamado no final de dealDamage
            return true;
        } else {
            console.log(`%c[DEBUG SUNG JIN-WOO - SUMMON] Sung Jin-woo não ativo ou habilidade já usada.`, 'color: #ff00ff;');
        }
        return false;
    } catch (error) {
        console.error(`%c[ERRO SUNG JIN-WOO INVOCAÇÃO] Erro inesperado:`, 'color: white; background-color: red; padding: 5px;', error);
        this.addLog(`ERRO na invocação do Sung Jin-woo: ${error.message}`);
        return false;
    }
},

// js/game.js - SUBSTITUA A FUNÇÃO summonMagoNegro INTEIRA E COMPLETA

summonMagoNegro: async function(defeatedCard) {
    console.log(`%c[DEBUG YUGI - SUMMON] Tentando invocar Mago Negro para ${defeatedCard.name}.`, 'color: #008080;');

    try {
        const yugiCard = this.players[defeatedCard.owner].team.find(c => (c.id === 'light6' || c.id === 'yami_yugi') && c.currentLife > 0);

        if (yugiCard && !yugiCard.hasUsedSummonAbilityOnce) {
            console.log(`%c[DEBUG YUGI - SUMMON] Yugi (%c${yugiCard.name}%c) ativo e habilidade de invocação não usada.`, 'color: #008080;', 'color: yellow;', 'color: #008080;');

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

            // Remove a carta derrotada do array 'team' ANTES de adicionar Mago Negro.
            this.removeCardFromBattlefield(defeatedCard);

            this.players[defeatedCard.owner].team.push(MagoNegro);
            yugiCard.hasUsedSummonAbilityOnce = true;

            this.addLog(`${yugiCard.name} invocou o ${MagoNegro.name} no lugar de ${defeatedCard.name}!`);
            console.log(`%c[DEBUG YUGI - SUMMON] ${MagoNegro.name} invocado!`, 'color: #00ff00; font-weight: bold;');

            this.reRenderCard(MagoNegro);

            if (MagoNegro.specialEffect) {
                await MagoNegro.specialEffect(this, MagoNegro, null);
            }

            // Não chame updateUI aqui, será chamado no final de dealDamage
            return true;
        } else {
            console.log(`%c[DEBUG YUGI - SUMMON] Yugi não ativo ou habilidade de invocação já usada.`, 'color: #ff00ff;');
        }
        return false;
    } catch (error) {
        console.error(`%c[ERRO MAGO NEGRO INVOCAÇÃO] Erro inesperado:`, 'color: white; background-color: red; padding: 5px;', error);
        this.addLog(`ERRO na invocação do Mago Negro: ${error.message}`);
        return false;
    }
},
summonMahoraga: async function(sacrificedCard) { // Recebe a carta sacrificada (Megumi) para pegar a posição
    console.log(`%c[DEBUG MAHORAGA - SUMMON] Tentando invocar Mahoraga na posi\u00e7\u00e3o de ${sacrificedCard.name}.`, 'color: #8A2BE2;');

    try {
        // Cria uma nova instância da carta Mahoraga
        const Mahoraga = new Card(
            mahoragaCardData.id,
            mahoragaCardData.name,
            mahoragaCardData.type,
            mahoragaCardData.attackRange,
            mahoragaCardData.maxLife,
            mahoragaCardData.element,
            mahoragaCardData.effectDescription,
            mahoragaCardData.specialEffect
        );
        Mahoraga.owner = sacrificedCard.owner;
        Mahoraga.position = sacrificedCard.position;

        this.players[sacrificedCard.owner].team.push(Mahoraga); // Adiciona Mahoraga ao time

        this.addLog(`O General ${Mahoraga.name} foi invocado na posi\u00e7\u00e3o de ${sacrificedCard.name}!`);
        console.log(`%c[DEBUG MAHORAGA - SUMMON] ${Mahoraga.name} invocado!`, 'color: #00ff00; font-weight: bold;');

        this.reRenderCard(Mahoraga); // Re-renderiza a carta Mahoraga na posição

        // Ativa o efeito on-summon do Mahoraga imediatamente
        if (Mahoraga.specialEffect) {
            await Mahoraga.specialEffect(this, Mahoraga, null);
        }

        this.updateUI();
        return true;
    } catch (error) {
        console.error(`%c[ERRO MAHORAGA INVOCA\u00c7\u00c3O] Erro inesperado:`, 'color: white; background-color: red; padding: 5px;', error);
        this.addLog(`ERRO na invoca\u00e7\u00e3o do Mahoraga: ${error.message}`);
        return false;
    }
},
transformKiluaToGodspeed: async function(kiluaCardInstance) {
    console.log(`%c[DEBUG KILUA TRANSF] INICIO - Tentando transformar ${kiluaCardInstance.name} (ID: ${kiluaCardInstance.id}, Pos: ${kiluaCardInstance.position}, Owner: ${kiluaCardInstance.owner}). Já usada: ${kiluaCardInstance.hasUsedTransformationAbilityOnce}`, 'color: #00CED1; font-weight: bold;');

    if (!kiluaCardInstance || kiluaCardInstance.id !== 'wind8' || kiluaCardInstance.hasUsedTransformationAbilityOnce) {
        console.warn(`%c[DEBUG KILUA TRANSF] Falha na validação para transformar Kilua.`, 'color: orange;');
        return false;
    }

    if (this.kiluaTransformSound) {
        this.kiluaTransformSound.play();
    } else {
        console.warn("Som de transformação do Kilua não configurado.");
    }

    const playerTeam = this.players[kiluaCardInstance.owner].team;
    const indexInTeam = playerTeam.findIndex(c => c.id === kiluaCardInstance.id);

    console.log(`%c[DEBUG KILUA TRANSF] Index de Kilua no time: ${indexInTeam}`, 'color: #00CED1;');

    if (indexInTeam > -1) {
        const kiluaGodspeed = new Card(
            kiluaGodspeedCardData.id,
            kiluaGodspeedCardData.name,
            kiluaGodspeedCardData.type,
            kiluaGodspeedCardData.attackRange,
            kiluaGodspeedCardData.maxLife,
            kiluaGodspeedCardData.element,
            kiluaGodspeedCardData.effectDescription,
            kiluaGodspeedCardData.specialEffect
        );
        kiluaGodspeed.owner = kiluaCardInstance.owner;
        kiluaGodspeed.position = kiluaCardInstance.position;
        kiluaGodspeed.hasUsedTransformationAbilityOnce = true;

        kiluaGodspeed.currentLife = kiluaCardInstance.currentLife; // Mantém a vida atual
        if (kiluaGodspeed.currentLife > kiluaGodspeed.maxLife) {
            kiluaGodspeed.currentLife = kiluaGodspeed.maxLife; // Ajusta se a vida exceder a nova máxima
        }

        console.log(`%c[DEBUG KILUA TRANSF] Substituindo Kilua Base por Kilua Godspeed no array do time. Antigo: ${kiluaCardInstance.id}, Novo: ${kiluaGodspeed.id}`, 'color: #32CD32;');
        playerTeam[indexInTeam] = kiluaGodspeed; // SUBSTITUIÇÃO NO ARRAY

        this.addLog(`${kiluaCardInstance.name} (Vento) atinge seu limite e se transforma em ${kiluaGodspeed.name}!`);
        console.log(`%c[DEBUG KILUA TRANSF] Chamando reRenderCard para Kilua Godspeed (ID: ${kiluaGodspeed.id}, Pos: ${kiluaGodspeed.position})...`, 'color: #1E90FF;');
        this.reRenderCard(kiluaGodspeed); // Renderiza a NOVA carta

        console.log(`%c[DEBUG KILUA TRANSF] FIM - Transformação de Kilua para Godspeed CONCLUÍDA.`, 'color: #008000; font-weight: bold;');
        return true;
    }
    console.warn(`%c[DEBUG KILUA TRANSF] Erro: Kilua original não encontrado no time (${kiluaCardInstance.owner}) na posição ${kiluaCardInstance.position} para transformação.`, 'color: red;');
    return false;
},
 // --- NOVA FUNÇÃO: transformSasukeToRinnegan ---
    transformSasukeToRinnegan: async function(sasukeCardInstance) {
    console.log(`%c[DEBUG SASUKE TRANSF] INICIO - Tentando transformar ${sasukeCardInstance.name} (ID: ${sasukeCardInstance.id}, Pos: ${sasukeCardInstance.position}, Owner: ${sasukeCardInstance.owner}). Já usada: ${sasukeCardInstance.hasUsedTransformationAbilityOnce}`, 'color: #8A2BE2; font-weight: bold;');

    if (!sasukeCardInstance || sasukeCardInstance.id !== 'fire8' || sasukeCardInstance.hasUsedTransformationAbilityOnce) {
        console.warn(`%c[DEBUG SASUKE TRANSF] Falha na validação para transformar Sasuke.`, 'color: orange;');
        return false;
    }

    if (this.transformationSound) { // Reutilizando o som de transformação genérico
        this.transformationSound.play();
    } else {
        console.warn("Som de transformação não configurado para Sasuke Rinnegan.");
    }

    const playerTeam = this.players[sasukeCardInstance.owner].team;
    const indexInTeam = playerTeam.findIndex(c => c.id === sasukeCardInstance.id);

    console.log(`%c[DEBUG SASUKE TRANSF] Index de Sasuke no time: ${indexInTeam}`, 'color: #8A2BE2;');

    if (indexInTeam > -1) {
        const sasukeRinnegan = new Card(
            sasukeRinneganCardData.id,
            sasukeRinneganCardData.name,
            sasukeRinneganCardData.type,
            sasukeRinneganCardData.attackRange,
            sasukeRinneganCardData.maxLife,
            sasukeRinneganCardData.element,
            sasukeRinneganCardData.effectDescription,
            sasukeRinneganCardData.specialEffect
        );
        sasukeRinnegan.owner = sasukeCardInstance.owner;
        sasukeRinnegan.position = sasukeCardInstance.position;
        sasukeRinnegan.hasUsedTransformationAbilityOnce = true;

        sasukeRinnegan.currentLife = sasukeCardInstance.currentLife; // Mantém a vida atual
        if (sasukeRinnegan.currentLife > sasukeRinnegan.maxLife) {
            sasukeRinnegan.currentLife = sasukeRinnegan.maxLife;
        }

        console.log(`%c[DEBUG SASUKE TRANSF] Substituindo Sasuke Base por Sasuke Rinnegan no array do time. Antigo: ${sasukeCardInstance.id}, Novo: ${sasukeRinnegan.id}`, 'color: #32CD32;');
        playerTeam[indexInTeam] = sasukeRinnegan; // SUBSTITUIÇÃO NO ARRAY

        this.addLog(`${sasukeCardInstance.name} (Fogo) é o único sobrevivente! Ele recebe o Rinnegan e se transforma!`);
        console.log(`%c[DEBUG SASUKE TRANSF] Chamando reRenderCard para Sasuke Rinnegan (ID: ${sasukeRinnegan.id}, Pos: ${sasukeRinnegan.position})...`, 'color: #1E90FF;');
        this.reRenderCard(sasukeRinnegan); // Renderiza a NOVA carta

        console.log(`%c[DEBUG SASUKE TRANSF] FIM - Transformação de Sasuke para Rinnegan CONCLUÍDA.`, 'color: #008000; font-weight: bold;');
        return true;
    }
    console.warn(`%c[DEBUG SASUKE TRANSF] Erro: Sasuke original não encontrado no time (${sasukeCardInstance.owner}) na posição ${sasukeCardInstance.position} para transformação.`, 'color: red;');
    return false;
},
checkAndExecuteKiluaPassive: async function(playerToCheckId) {
    const kiluaCard = this.players[playerToCheckId].team.find(c => c.id === 'wind8' && c.currentLife > 0);

    // Se não há Kilua ou ele já transformou, não faz nada
    if (!kiluaCard || kiluaCard.hasUsedTransformationAbilityOnce) {
        return false;
    }

    const opponentPlayerId = this.getOpponent(playerToCheckId);
    const opponentCards = this.getPlayersCards(opponentPlayerId);

    // Procura por um inimigo para executar (o primeiro encontrado)
    for (const enemy of opponentCards) {
        if (enemy.currentLife > 0 && enemy.currentLife <= 5) { // Inimigo vivo com 5 ou menos de vida
            this.addLog(`${kiluaCard.name} (Vento) detectou ${enemy.name} com vida baixa e ativa sua execução passiva!`);

            // Aqui Kilua "ataca e executa". O dano é sempre o suficiente para zerar.
            // Para efeitos de log e rastreamento, vamos simular o dano final.
            const damageCausedByKilua = enemy.currentLife; // Kilua causa dano igual à vida restante do alvo
            enemy.currentLife = 0; // Executa o inimigo
            
            this.addLog(`${enemy.name} foi executado por ${kiluaCard.name}!`);
            this.reRenderCard(enemy); // Atualiza o visual do inimigo (vida zerada)

            // Tentar transformar Kilua
            await this.transformKiluaToGodspeed(kiluaCard);

            // A carta executada será tratada como derrotada no final de dealDamage
            return true; // Indica que uma execução ocorreu
        }
    }
    return false; // Nenhuma execução ocorreu
},
transformToshinoriToAllMight: async function(toshinoriCardInstance) {
    console.log(`%c[DEBUG ALL MIGHT TRANSF] INICIO - Tentando transformar ${toshinoriCardInstance.name} (ID: ${toshinoriCardInstance.id}, Pos: ${toshinoriCardInstance.position}, Owner: ${toshinoriCardInstance.owner}). Já usada: ${toshinoriCardInstance.hasUsedTransformationAbilityOnce}`, 'color: #FFD700; font-weight: bold;');

    if (!toshinoriCardInstance || toshinoriCardInstance.id !== 'light8' || toshinoriCardInstance.hasUsedTransformationAbilityOnce) {
        console.warn(`%c[DEBUG ALL MIGHT TRANSF] Falha na validação para transformar Toshinori Yagi.`, 'color: orange;');
        return false;
    }

    if (this.allMightTransformSound) {
        this.allMightTransformSound.play();
    } else {
        console.warn("Som de transformação não configurado para Toshinori Yagi.");
    }

    const playerTeam = this.players[toshinoriCardInstance.owner].team;
    const indexInTeam = playerTeam.findIndex(c => c.id === toshinoriCardInstance.id);

    console.log(`%c[DEBUG ALL MIGHT TRANSF] Index de Toshinori no time: ${indexInTeam}`, 'color: #FFD700;');

    if (indexInTeam > -1) {
        const allMight = new Card(
            allMightCardData.id,
            allMightCardData.name,
            allMightCardData.type,
            allMightCardData.attackRange,
            allMightCardData.maxLife,
            allMightCardData.element,
            allMightCardData.effectDescription,
            allMightCardData.specialEffect
        );
        allMight.owner = toshinoriCardInstance.owner;
        allMight.position = toshinoriCardInstance.position;
        allMight.hasUsedTransformationAbilityOnce = true;

        allMight.currentLife = toshinoriCardInstance.currentLife;
        if (allMight.currentLife > allMight.maxLife) {
            allMight.currentLife = allMight.maxLife;
        }

        console.log(`%c[DEBUG ALL MIGHT TRANSF] Substituindo Toshinori Yagi por All Might no array do time. Antigo: ${toshinoriCardInstance.id}, Novo: ${allMight.id}`, 'color: #32CD32;');
        playerTeam[indexInTeam] = allMight; // SUBSTITUIÇÃO NO ARRAY

        this.addLog(`${toshinoriCardInstance.name} (Luz) despertou seu verdadeiro poder e se transforma em ${allMight.name}!`);
        console.log(`%c[DEBUG ALL MIGHT TRANSF] Chamando reRenderCard para All Might (ID: ${allMight.id}, Pos: ${allMight.position})...`, 'color: #1E90FF;');
        this.reRenderCard(allMight); // Renderiza a NOVA carta

        console.log(`%c[DEBUG ALL MIGHT TRANSF] FIM - Transformação de Toshinori Yagi para All Might CONCLUÍDA.`, 'color: #008000; font-weight: bold;');
        return true;
    }
    console.warn(`%c[DEBUG ALL MIGHT TRANSF] Erro: Toshinori Yagi original não encontrado no time (${toshinoriCardInstance.owner}) na posição ${toshinoriCardInstance.position} para transformação.`, 'color: red;');
    return false;
},

// Modifique a função applyEffect existente:
applyEffect: function(card, effectName, turns, value) {
    console.log(`%c[DEBUG EFFECTS] Tentando aplicar efeito '${effectName}' a ${card.name}.`, 'color: #4682B4;');
    let finalTurns = turns;
    if (effectName === 'Escudo' || effectName === 'Partitura') {
        finalTurns = -1; // -1 significa "dura para sempre"
    }

    const isDebuff = ['Amaldiçoar', 'Queimar', 'Enraizar', 'Atordoar', 'Partitura'].includes(effectName);

    // Lógica para Toshinori Yagi (light8)
    const toshinoriInTeam = this.players[card.owner].team.find(c => c.id === 'light8' && c.currentLife > 0);

    if (isDebuff && toshinoriInTeam && !toshinoriInTeam.hasUsedTransformationAbilityOnce) {
        this.addLog(`${toshinoriInTeam.name} (Luz) passivamente removeu o efeito '${effectName}' de ${card.name}!`);
        delete card.effectsApplied[effectName]; // Remove o debuff
        if (effectName === 'Amaldiçoar' || effectName === 'Enraizar' || effectName === 'Atordoar') {
            card.canAttack = true; // Permite atacar novamente
        }
        this.reRenderCard(card); // Re-renderiza o aliado para mostrar a remoção do debuff

        // ATENÇÃO: Chama a transformação de Toshinori após remover o debuff
        this.transformToshinoriToAllMight(toshinoriInTeam);

        console.log(`%c[DEBUG TOSHINORI YAGI] Efeito '${effectName}' removido de ${card.name} por ${toshinoriInTeam.name}.`, 'color: #fbbf24;');
        return; // Sai da função, o efeito não é aplicado
    }

    // Se não foi removido por Toshinori ou ele já transformou, aplica o efeito normalmente
    card.effectsApplied[effectName] = { turns: finalTurns, value: value };
    if (effectName === 'Amaldiçoar' || effectName === 'Enraizar' || effectName === 'Atordoar') {
        card.canAttack = false;
    }
    console.log(`%c[DEBUG EFFECTS] Efeito '${effectName}' aplicado a ${card.name}. Turnos: ${finalTurns}, Valor: ${value}. Estado atual:`, 'color: #4682B4;', card.effectsApplied);
    this.reRenderCard(card);
    this.updateUI();
},
transformGonToAdult: async function(gonCardInstance) {
    console.log(`%c[DEBUG GON TRANSF] INICIO - Tentando transformar ${gonCardInstance.name} (ID: ${gonCardInstance.id}, Pos: ${gonCardInstance.position}, Owner: ${gonCardInstance.owner}). Já usada: ${gonCardInstance.hasUsedTransformationAbilityOnce}`, 'color: #FFD700; font-weight: bold;');

    if (!gonCardInstance || gonCardInstance.id !== 'earth7' || gonCardInstance.hasUsedTransformationAbilityOnce) {
        console.warn(`%c[DEBUG GON TRANSF] Falha na validação para transformar Gon.`, 'color: orange;');
        return false;
    }

    // Tocar som de transformação do Gon
    if (this.gonTransformSound) {
        this.gonTransformSound.play();
    } else {
        console.warn("Som de transformação do Gon não configurado.");
    }

    const playerTeam = this.players[gonCardInstance.owner].team;
    const indexInTeam = playerTeam.findIndex(c => c.id === gonCardInstance.id);

    console.log(`%c[DEBUG GON TRANSF] Index de Gon no time: ${indexInTeam}`, 'color: #FFD700;');

    if (indexInTeam > -1) {
        const gonAdulto = new Card(
            gonAdultoCardData.id,
            gonAdultoCardData.name,
            gonAdultoCardData.type,
            gonAdultoCardData.attackRange,
            gonAdultoCardData.maxLife,
            gonAdultoCardData.element,
            gonAdultoCardData.effectDescription,
            gonAdultoCardData.specialEffect
        );
        gonAdulto.owner = gonCardInstance.owner;
        gonAdulto.position = gonCardInstance.position;
        gonAdulto.hasUsedTransformationAbilityOnce = true;
        gonAdulto.currentLife = gonAdulto.maxLife; // Assume vida cheia ao transformar, se preferir o comportamento original, mude para gonCardInstance.currentLife

        console.log(`%c[DEBUG GON TRANSF] Substituindo Gon Criança por Gon Adulto no array do time. Antigo: ${gonCardInstance.id}, Novo: ${gonAdulto.id}`, 'color: #32CD32;');
        playerTeam[indexInTeam] = gonAdulto; // SUBSTITUIÇÃO CRUCIAL NO ARRAY

        gonCardInstance.hasUsedTransformationAbilityOnce = true; // Garante que a referência antiga não possa reativar
        this.addLog(`O poder de ${gonCardInstance.name} explode! Ele se transforma em ${gonAdulto.name}!`);

        console.log(`%c[DEBUG GON TRANSF] Chamando reRenderCard para Gon Adulto (ID: ${gonAdulto.id}, Pos: ${gonAdulto.position})...`, 'color: #1E90FF;');
        this.reRenderCard(gonAdulto); // Renderiza a NOVA carta (Gon Adulto) no slot

        console.log(`%c[DEBUG GON TRANSF] FIM - Transformação de Gon para Adulto CONCLUÍDA.`, 'color: #008000; font-weight: bold;');
        return true;
    }
    console.warn(`%c[DEBUG GON TRANSF] Erro: Gon original não encontrado no time (${gonCardInstance.owner}) na posição ${gonCardInstance.position} para transformação.`, 'color: red;');
    return false;
},
};
