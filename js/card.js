
export class Card {
   constructor(id, name, type, attackRange, maxLife, element, effectDescription, specialEffect = null, image = null) { // <<< AQUI: 9 PAR\u00c2METROS
        this.id = id;
        this.name = name;
        this.type = type;
        this.attackMin = attackRange[0];
        this.attackMax = attackRange[1];
        this.maxLife = maxLife;
        this.currentLife = maxLife; // Come\u00e7a com vida m\u00e1xima
        this.element = element;
        this.effectDescription = effectDescription;
        this.specialEffect = specialEffect; // A fun\u00e7\u00e3o do efeito especial
        this.image = image; // <<< NOVO: Propriedade para o caminho da imagem

        this.owner = null; 
        this.position = null;
        this.hasAttackedThisTurn = false;
        this.effectsApplied = {}; 
        this.canAttack = true; 
        this.hasUsedSpecialAbilityOnce = false; 
        this.tempAttackBonus = 0; 
        this.tempAttackBonusSource = null; 
        this.hasUsedTransformationAbilityOnce = false; // Para Yugi
        this.hasUsedSummonAbilityOnce = false;       // Para Yugi
    }

    // Método para renderizar o HTML da carta
    render(isDraftable = false, isBattleCard = false, isSelected = false, isTarget = false) {
        const cardDiv = document.createElement('div');
        cardDiv.id = `card-${this.id}`;
        cardDiv.classList.add('card', `element-color-${this.element.toLowerCase()}`);
        
        // Aplica classes de seleção e transformações
        if (isSelected) cardDiv.classList.add('selected');
        if (isTarget) cardDiv.classList.add('target-selected');
        if (!this.canAttack && this.currentLife > 0) cardDiv.classList.add('grayscale');

        // ADIÇÃO PARA O ESCUDO VISUAL
        if (this.effectsApplied['Escudo']) { 
            cardDiv.classList.add('has-shield');
        }

        // Adiciona overlay "Derrotado" se a carta estiver morta no campo de batalha
        if (this.currentLife <= 0 && isBattleCard) {
            cardDiv.classList.add('opacity-50', 'pointer-events-none');
            const defeatedOverlay = document.createElement('div');
            defeatedOverlay.classList.add('absolute', 'inset-0', 'bg-red-900', 'bg-opacity-70', 'flex', 'items-center', 'justify-center', 'font-bold', 'text-xl', 'rounded-lg', 'text-white');
            defeatedOverlay.textContent = 'DERROTADO';
            cardDiv.appendChild(defeatedOverlay);
        }

        // Processa o texto do efeito para destacar o elemento
        let effectText = this.effectDescription;
        const colorMap = {
            'Fogo:': '#ef4444', 
            'Agua:': '#3b82f6', 
            'Terra:': '#a16207', 
            'Ar:': '#20B2AA', 
            'Dark:': '#171717', 
            'Luz:': '#fbbf24' 
        };
        
        Object.keys(colorMap).forEach(prefix => {
            if (effectText.includes(prefix)) {
                effectText = effectText.replace(
                    prefix,  
                    `<span style="color: ${colorMap[prefix]}; font-weight: bold;">${prefix}</span>`
                );
            }
        });

     cardDiv.innerHTML = `
    <div class="card-image">
        <img src="img/${this.id}.png" onerror="this.onerror=null; this.src='https://placehold.co/120x90/4a5568/a0aec0?text=Sem+Img';" alt="${this.name}" class="w-full h-full object-cover">
    </div>
    <span class="card-name">${this.name}</span>
    <span class="card-attribute card-class">${this.type}</span>
    <span class="card-effect-text">${effectText}</span>
    <div class="card-stats">
        <span>ATK: ${this.attackMin + this.tempAttackBonus}-${this.attackMax + this.tempAttackBonus}</span>
        <span class="card-hp-text ${this.currentLife < this.maxLife ? 'damaged' : ''}">VIDA: ${this.currentLife}/${this.maxLife}</span>
    </div>
    <div class="card-hp-bar">
        <div class="card-hp-fill" style="width: ${(this.currentLife / this.maxLife) * 100}%"></div>
    </div>
    
    ${this.effectsApplied['Escudo'] && this.effectsApplied['Escudo'].value > 0 ? `<div class="shield-value-overlay">🛡️ ${this.effectsApplied['Escudo'].value}</div>` : ''}

    <div class="negative-effects-container">
        ${this.effectsApplied['Partitura'] ? `<div class="debuff-icon partitura-icon">🎶 ${this.effectsApplied['Partitura'].value}</div>` : ''}
        ${this.effectsApplied['Queimar'] ? `<div class="debuff-icon burn-icon">🔥 ${this.effectsApplied['Queimar'].value}</div>` : ''}
        ${this.effectsApplied['Amaldiçoar'] ? `<div class="debuff-icon cursed-icon">💀 ${this.effectsApplied['Amaldiçoar'].value}</div>` : ''}
    </div>
`;

        
        if (isDraftable) {
            cardDiv.onclick = () => window.game.selectCard(this.id); 
        } else if (isBattleCard) {
            cardDiv.onclick = () => window.game.handleCardClick(this.id); 
        }
        cardDiv.oncontextmenu = (event) => {
            event.preventDefault(); 
            window.game.openCardDetailModal(this); 
        };

        return cardDiv;
    }

    elementColorCode() {
        switch (this.element) {
            case 'Fogo': return 'ef4444';
            case 'Agua': return '3b82f6';
            case 'Terra': return 'a16207';
            case 'Ar': return '20B2AA';
            case 'Dark': return '171717';
            case 'Luz': return 'fbbf24';
            default: return 'cccccc';
        }
    }
}

// --- Dados de Todas as 30 Cartas ---
export const allCards = [
    // Água
   new Card('water1', 'Blastoise', 'Tank', [2, 4], 50, 'Agua', 'Agua: Sempre que um aliado ataca, Blastoise se cura em 3 HP.', async (game, self, target) => {
        // Este specialEffect será chamado APÓS QUALQUER ALIADO de Blastoise realizar um ataque.
        // A 'game.isProcessingAttack' estará ativa para o ataque do aliado.
        // 'self' é Blastoise, 'target' é o alvo do ataque do aliado.

        // Condição para ativar: Verificar se Blastoise está vivo e se um ataque está sendo processado
        // (e que o atacante é um aliado do Blastoise, mas isso será filtrado na chamada em game.js)
        if (self.currentLife > 0 && game.isProcessingAttack && game.selectedAttacker && game.selectedAttacker.owner === self.owner) {
            // Garante que o ataque não é do próprio Blastoise (se Blastoise ataca, ele não cura a si mesmo por isso)
            if (game.selectedAttacker.id !== self.id) {
                const healAmount = 3;
                game.healCard(self, healAmount);
                game.addLog(`${self.name} (Agua) curou-se em ${healAmount} HP porque ${game.selectedAttacker.name} atacou. Vida: ${self.currentLife}`);
                game.updateUI(); // Atualiza a UI para mostrar a cura
                return true; // Indica que a habilidade foi ativada
            }
        }
        return false; // Habilidade não ativada ou condições não met
    }),
    new Card('water3', 'Tobirama', 'Damage', [13, 15], 22, 'Agua', 'Agua: O dano na criatura do elemento Fogo é aumentado em 15.', async (game, self, target) => {
        if (target && target.element === 'Fogo') {
            game.addLog(`${self.name} causa 15 de dano adicional a ${target.name} (Fogo)!`);
            return 15;
        }
        return 0;
    }),
    new Card('water4', 'Tomioka', 'Damage', [13, 17], 20, 'Agua', 'Agua: Pode atacar o Healer inimigo mesmo com o Tank ainda vivo.', null),
    new Card('water5', 'Noelle', 'Healer', [8, 10], 30, 'Agua', 'Agua: Ao curar o aliado, aumenta a cura em 10 quando tem  outro aliado de Água no time.', async (game, self, target) => {
        if (game.isProcessingHeal && self.id === game.selectedAttacker.id && target) {
            const waterAllies = game.getPlayersCards(self.owner).filter(c => c.element === 'Agua' && c.id !== self.id);
            if (waterAllies.length >= 1) {
                game.addLog(`${self.name} aumentou a cura em 10 por ter 1+ aliados de Água!`);
                return 10;
            }
        }
        return 0;
    }),
   new Card('water6', 'Uzui [Agua]', 'Damage', [14, 17], 22, 'Agua', 'Agua: Ao iniciar a batalha, marca um inimigo aleat\u00f3rio com Partitura, fazendo-o sofrer 3 de dano a mais sempre que atacado (dura a partida toda).', async (game, self, target) => {
    // Este specialEffect ser\u00e1 chamado APENAS no in\u00edcio da batalha
    console.log(`%c[DEBUG UZUI] Habilidade de Uzui (Partitura Autom\u00e1tica) verificada. Dono: %c${self.owner}%c.`, 'color: #00BFFF;', 'color: yellow;', 'color: #00BFFF;');

    // A habilidade ativa s\u00f3 uma vez no in\u00edcio da batalha
    if (game.currentPhase === 'battle' && self.currentLife > 0 && !self.hasUsedSpecialAbilityOnce) {
        console.log(`%c[DEBUG UZUI] Condi\u00e7\u00f5es de ativa\u00e7\u00e3o autom\u00e1tica atendidas.`, 'color: #00BFFF;');

        const opponentCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.currentLife > 0);

        if (opponentCards.length > 0) {
            const randomEnemy = opponentCards[Math.floor(Math.random() * opponentCards.length)];
            game.applyEffect(randomEnemy, 'Partitura', -1, 3); // Aplica o efeito 'Partitura' (dura a partida toda, valor 3)
            game.addLog(`${self.name} (Agua) marcou ${randomEnemy.name} com a Partitura autom\u00e1tica!`);
            console.log(`%c[DEBUG UZUI] ${randomEnemy.name} marcado com Partitura autom\u00e1tica (+3 dano extra, dura a partida toda).`, 'color: #00BFFF;');
            self.hasUsedSpecialAbilityOnce = true; // Marca a habilidade como usada (uma vez por partida)
            game.updateUI(); // Atualiza a UI para mostrar a marcação
            return true;
        } else {
            game.addLog(`${self.name} (Agua) n\u00e3o encontrou inimigos para marcar com a Partitura autom\u00e1tica.`);
            console.log(`%c[DEBUG UZUI] Nenhum inimigo para marcar (autom\u00e1tico).`, 'color: #00BFFF;');
        }
    } else {
        console.log(`%c[DEBUG UZUI] Partitura Autom\u00e1tica N\u00c3O ativada. Detalhes: Fase=%c${game.currentPhase}%c, Vida=%c${self.currentLife}%c, J\u00e1Usada=%c${self.hasUsedSpecialAbilityOnce}`, 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;');
    }
    return false;
}, 'img/water6.png'), 

    // Fogo
    new Card('fire1', 'Escanor', 'Tank', [3, 5], 42, 'Fogo', 'Fogo: Tem 50% de chance de atacar junto de outra criatura atacante.', async (game, self, target) => {
    if (game.isProcessingAttack && self.id === game.selectedAttacker.id && Math.random() < 0.50) {
        // Tocar o som do Escanor
        if (game.escanorSound) { // <-- Verifique se game.escanorSound existe
            game.escanorSound.play();
        } else {
            console.warn("Som do Escanor não configurado.");
        }
        game.addLog(`${self.name} (Fogo) ataca junto!`);
        await game.performAttack(self, target, true);
        return true;
    }
    return false;
}),
    new Card('fire2', 'Endeavor', 'Tank', [2, 4], 46, 'Fogo', 'Fogo: Chance de 20% de queimar o alvo inimigo que atacou, em 3 de dano, independente se o ataque do inimigo for nele ou não.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === target.id && Math.random() < 0.20) {
            const attacker = game.selectedAttacker;
            if (attacker && attacker.owner !== self.owner) {
                game.applyEffect(attacker, 'Queimar', 2, 3); 
                game.addLog(`${self.name} (Fogo) queimou ${attacker.name} por 2 turnos!`);
                game.updateUI();
            }
        }
    }),
    new Card('fire3', 'Deidara', 'Damage', [13, 17], 23, 'Fogo', 'Fogo: Se morrer ele causa dano igual a 15 a um monstro inimigo aleatório.', async (game, self, target) => {
        if (game.isCardDefeated && self.currentLife <= 0) {
            const enemyCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.currentLife > 0);
            if (enemyCards.length > 0) {
                const randomTarget = enemyCards[Math.floor(Math.random() * enemyCards.length)];
                game.dealDamage(randomTarget, 15); 
                game.addLog(`${self.name} (Fogo) devastou o campo, causando 15 de dano a ${randomTarget.name} ao ser derrotado!`);
                game.updateUI();
            }
        }
    }),
    new Card('fire4', 'Roy Mustang', 'Damage', [11, 14], 21, 'Fogo', 'Fogo: Sempre que atacar causa 5 de dano a outras duas criaturas do inimigo aleatórias.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === game.selectedAttacker.id) {
            const enemyCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.id !== target.id && c.currentLife > 0);
            if (enemyCards.length > 0) {
                const targets = [];
                while (targets.length < 2 && enemyCards.length > 0) {
                    const randomIndex = Math.floor(Math.random() * enemyCards.length);
                    targets.push(enemyCards.splice(randomIndex, 1)[0]);
                }
                for (const splashTarget of targets) {
                    game.dealDamage(splashTarget, 5);
                    game.addLog(`${self.name} (Fogo) incendiou ${splashTarget.name} com 5 de dano secundário.`);
                }
                game.updateUI();
            }
        }
    }),
    new Card('fire5', 'Rengoku', 'Healer', [10, 15], 32, 'Fogo', 'Fogo: Se tem outro aliado de Fogo no time ele pode atacar o inimigo e o dano causado cura um aliado ferido aleatório.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === game.selectedAttacker.id) {
            const fireAllies = game.getPlayersCards(self.owner).filter(c => c.element === 'Fogo' && c.id !== self.id && c.currentLife > 0);
            if (fireAllies.length >= 1) { 
                const damageDealt = game.currentDamageDealt; 
                const injuredAllies = game.getPlayersCards(self.owner).filter(c => c.currentLife < c.maxLife && c.currentLife > 0);
                if (injuredAllies.length > 0 && damageDealt > 0) {
                    const randomHealTarget = injuredAllies[Math.floor(Math.random() * injuredAllies.length)];
                    game.healCard(randomHealTarget, damageDealt);
                    game.addLog(`${self.name} (Fogo) transformou ${damageDealt} de dano em cura para ${randomHealTarget.name}.`);
                    game.updateUI();
                }
                return true; 
            }
        }
        return false;
    }),
    new Card('fire6', 'Benimaru', 'Damage', [12, 14], 22, 'Fogo', 'Fogo: Aumenta em 3-3 de ataque para cada personagem de Fogo no seu time.', async (game, self, target) => {
        // Este specialEffect será chamado no INÍCIO DO TURNO do jogador de Benimaru.
        // Ele precisa recalcular o bônus de ataque com base nos aliados de Fogo presentes.
        
        // Verifica se a habilidade já foi aplicada no turno atual para evitar re-aplicar se a função for chamada múltiplas vezes.
        // A propriedade 'hasAttackedThisTurn' é redefinida a cada turno, então podemos usá-la para controlar o "por turno".
        // Alternativamente, poderíamos adicionar uma nova flag como 'hasAppliedBenimaruBuffThisTurn'.
        // Para simplicidade, vamos recalcular sempre que for o início do turno do dono.
        
        console.log(`%c[DEBUG BENIMARU] Habilidade de Benimaru verificada. Dono: %c${self.owner}%c.`, 'color: #DC143C;', 'color: yellow;', 'color: #DC143C;'); // Carmesim para Fogo

        // Reseta o bônus temporário de ataque de Benimaru ANTES de recalcular
        self.tempAttackBonus = 0;

        // Encontra todas as cartas de Fogo no time do Benimaru (incluindo ele mesmo, se vivo)
        const fireAllies = game.getPlayersCards(self.owner).filter(c => c.element === 'Fogo' && c.currentLife > 0);
        
        // O bônus é 3 por cada personagem de Fogo (incluindo ele mesmo)
        const bonusPerFireCard = 3;
        const totalBonus = fireAllies.length * bonusPerFireCard;

        if (totalBonus > 0) {
            self.tempAttackBonus += totalBonus;
            game.addLog(`${self.name} (Fogo) aumentou seu ataque em ${totalBonus} devido a ${fireAllies.length} aliados de Fogo! Novo ATK: ${self.attackMin + self.tempAttackBonus}-${self.attackMax + self.tempAttackBonus}.`);
            console.log(`%c[DEBUG BENIMARU] Ataque de Benimaru ajustado para: %c${self.attackMin + self.tempAttackBonus}-${self.attackMax + self.tempAttackBonus}`, 'color: #DC143C;', 'color: yellow;');
            game.updateUI(); // Atualiza a UI para refletir o novo ataque
            return true;
        } else {
            game.addLog(`${self.name} (Fogo) não encontrou aliados de Fogo para aumentar seu ataque.`);
            console.log(`%c[DEBUG BENIMARU] Nenhum aliado de Fogo encontrado.`, 'color: #DC143C;');
        }
        return false;
    }, 'img/fire6.png'), // Certifique-se de ter 'img/fire6.png'
    new Card('fire7', 'Vegeta', 'Tank', [4, 6], 52, 'Fogo', 'Fogo: Diminui o ataque do inimigo que o atacar em 2-2 (mínimo de 10).', async (game, self, currentAttackerCard) => { // <-- MUDE 'target' para 'currentAttackerCard' para clareza
    // Este specialEffect será chamado APÓS Vegeta receber dano
    console.log(`%c[DEBUG VEGETA] Habilidade de Vegeta (Redu\u00e7\u00e3o de ATK) verificada. Alvo de ataque: %c${self.name}%c.`, 'color: #FF4500;', 'color: yellow;', 'color: #FF4500;');

    // Verifica se Vegeta está vivo e se há um atacante válido que não seja ele mesmo
    if (self.currentLife > 0 && currentAttackerCard && currentAttackerCard.owner !== self.owner && currentAttackerCard.currentLife > 0) {
        // A condição self.id === target.id (do seu código original) foi removida,
        // pois esta habilidade é chamada em dealDamage, onde 'self' É O VEGETA,
        // e 'currentAttackerCard' É O ATACANTE, que já foi passado corretamente.

        const reductionAmount = 2; // Diminui em 2-2 o ataque

        // Aplica a redução no ataque mínimo e máximo do atacante
        currentAttackerCard.attackMin = Math.max(10, currentAttackerCard.attackMin - reductionAmount); // Mínimo de 10
        currentAttackerCard.attackMax = Math.max(10, currentAttackerCard.attackMax - reductionAmount); // Mínimo de 10

        game.addLog(`${self.name} (Fogo) diminuiu o ataque de ${currentAttackerCard.name} em ${reductionAmount}! Novo ATK de ${currentAttackerCard.name}: ${currentAttackerCard.attackMin}-${currentAttackerCard.attackMax}.`);
        console.log(`%c[DEBUG VEGETA] Ataque de ${currentAttackerCard.name} reduzido para: %c${currentAttackerCard.attackMin}-${currentAttackerCard.attackMax}`, 'color: #FF4500;', 'color: yellow;');
        
        game.updateUI(); // Atualiza a UI para refletir o novo ataque do inimigo
        return true;
    }
    return false;
}, 'img/fire7.png'), // Certifique-se de ter 'img/fire7.png'


    // Terra
    new Card('earth1', 'Gaara', 'Tank', [1, 3], 45, 'Terra', 'Terra: Quando Gaara recebe dano, ele tem 50% de chance de reduzir esse dano em 5.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === target.id && Math.random() < 0.50) {
            game.addLog(`${self.name} (Terra) reduziu 5 de dano recebido!`);
            return -5; 
        }
        return 0;
    }),
    new Card('earth2', 'Toph', 'Tank', [2, 4], 46, 'Terra', 'Terra: Uma vez por turno, Toph pode conceder 5 de Escudo (absorve os próximos 5 de dano) a um aliado adjacente (nas posições 3, 4 ou 5) pelo próximo ataque que ele sofrer.', async (game, self, target) => {
        if (game.currentPhase === 'battle' && game.currentPlayerId === self.owner && self.currentLife > 0 && !self.hasUsedSpecialAbilityOnce) {
            const allyCards = game.getPlayersCards(self.owner).filter(c => c.currentLife > 0 && c.id !== self.id);
            const backRowAllies = allyCards.filter(c => ['pos3', 'pos4', 'pos5'].includes(c.position));
            
            if (backRowAllies.length > 0) {
                const targetAlly = backRowAllies[Math.floor(Math.random() * backRowAllies.length)];
                game.applyEffect(targetAlly, 'Escudo', -1, 5); 
                self.hasUsedSpecialAbilityOnce = true; 
                game.addLog(`${self.name} (Terra) concedeu 5 de Escudo a ${targetAlly.name}.`);
                game.updateUI();
                return true;
            }
        }
        return false;
    }),
    new Card('earth3', 'Edward Elric', 'Damage', [10, 15], 24, 'Terra', 'Terra: Sempre que Edward Elric é atacado, o atacante recebe 8 de dano.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === target.id) {
            const attacker = game.selectedAttacker;
            if (attacker) {
                game.dealDamage(attacker, 8); 
                game.addLog(`${self.name} (Terra) espinhou ${attacker.name}, causando 8 de dano!`);
                game.updateUI();
            }
        }
    }),
    new Card('earth4', 'Might Guy', 'Damage', [13, 18], 22, 'Terra', 'Terra: Might Guy ignora 10 de Escudo (se o inimigo tiver um efeito que absorve dano) ao atacar.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === game.selectedAttacker.id && target.effectsApplied['Escudo']) {
            game.addLog(`${self.name} (Terra) ignorou 10 de Escudo de ${target.name}.`);
            return 10; 
        }
        return 0;
    }),
    new Card('earth5', 'Tsunade', 'Healer', [16, 18], 28, 'Terra', 'Terra: No início do turno do jogador, se Tsunade tiver menos que sua Vida máxima, ele se cura em 5.', async (game, self, target) => {
        if (game.currentPhase === 'battle' && game.currentPlayerId === self.owner && self.currentLife < self.maxLife && self.currentLife > 0) {
            game.healCard(self, 5);
            game.addLog(`${self.name} (Terra) regenerou 5 de vida. Vida: ${self.currentLife}`);
            game.updateUI();
        }
        
    }),
    new Card('earth6', 'Luffy', 'Tank', [3, 5], 60, 'Terra', 'Terra: Sempre que receber dano, aumenta em 1-1 o pr\u00f3prio ataque.', async (game, self, target) => {
    // Este specialEffect ser\u00e1 chamado AP\u00d3S Luffy receber dano
    console.log(`%c[DEBUG LUFFY] Habilidade de Luffy verificada. Recebendo dano: %c${self.name}%c.`, 'color: brown;', 'color: yellow;', 'color: brown;'); // Brown para Terra

    // A condição 'game.isProcessingAttack' não é necessária aqui, pois ele ativará por ser o TARGET do dano, não o atacante.
    // A lógica de aumento de ataque acontece sempre que ele recebe dano.
    if (self.currentLife > 0) { // Garante que Luffy está vivo para aumentar ataque
        self.attackMin += 1;
        self.attackMax += 1;
        game.addLog(`${self.name} (Terra) recebeu dano e aumentou seu ataque em 1! Novo ATK: <span class="math-inline">\{self\.attackMin\}\-</span>{self.attackMax}.`);
        console.log(`%c[DEBUG LUFFY] Ataque de Luffy aumentado para: %c${self.attackMin}-${self.attackMax}`, 'color: brown;', 'color: yellow;');
        game.updateUI(); // Atualiza a UI para refletir o novo ataque
        return true;
    }
    console.log(`%c[DEBUG LUFFY] Luffy n\u00e3o aumentou ataque: Derrotado.`, 'color: red;');
    return false;
}, 'img/earth6.png'),
new Card('earth7', 'Gon', 'Damage', [5, 6], 15, 'Terra', 'Terra: Ao ser derrotado, ele se transforma em Gon Adulto.', async (game, self, target) => {
        // Este specialEffect será chamado quando Gon (criança) for derrotado.
        console.log(`%c[DEBUG GON CRIANÇA] Habilidade de transforma\u00e7\u00e3o de Gon verificada. Derrotado: %c${self.name}%c.`, 'color: #8B4513;', 'color: yellow;', 'color: #8B4513;'); // Marrom para Terra

        // A flag 'isCardDefeated' será verdadeira quando dealDamage chamar essa habilidade.
        if (game.isCardDefeated) { // Verifica se a carta foi derrotada
            game.addLog(`${self.name} foi derrotado! Mas sua f\u00faria despertou... Ele se transforma!`);

            // Tocar som de transformação (se você criar um audio/GonTransform.mp3)
            if (game.gonTransformSound) {
                game.gonTransformSound.play();
            } else {
                console.warn("Som de transforma\u00e7\u00e3o do Gon n\u00e3o configurado.");
            }

            // A lógica real da transformação será em game.js na função dealDamage.
            // Aqui, apenas indicamos que a habilidade foi processada.
            return true;
        }
        return false;
    }, 'img/earth7.png'), // Certifique-se de ter 'img/earth7.png'

    // Vento
    new Card('wind1', 'Obito', 'Tank', [2, 4], 47, 'Ar', 'Ar: Obito tem 35% de chance de esquivar de qualquer ataque recebido, não sofrendo dano.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === target.id && Math.random() < 0.35) {
            game.addLog(`${self.name} (Vento) esquivou do ataque!`);
            return true; 
        }
        return false;
    }),
    new Card('wind2', 'Aang', 'Tank', [1, 3], 42, 'Ar', 'Ar: Quando Aang é atacado, ele tem 40% de chance de redirecionar 50% do dano para outra criatura inimiga aleatória.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === target.id && Math.random() < 0.40) {
            const originalDamage = game.currentDamageDealt; 
            const redirectDamage = Math.floor(originalDamage / 2);
            const enemyCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.currentLife > 0 && c.id !== game.selectedAttacker.id);
            if (enemyCards.length > 0 && redirectDamage > 0) {
                const randomTarget = enemyCards[Math.floor(Math.random() * enemyCards.length)];
                game.dealDamage(randomTarget, redirectDamage); 
                game.addLog(`${self.name} (Vento) redirecionou ${redirectDamage} de dano para ${randomTarget.name}!`);
                game.updateUI();
            }
        }
    }),
    new Card('wind3', 'Toji', 'Damage', [14, 17], 20, 'Ar', 'Ar: Toji sempre ataca duas vezes, causando metade do seu dano normal em cada ataque (arredondado para cima).', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === game.selectedAttacker.id && !game.isTojiSecondHit) {
            game.addLog(`${self.name} (Ar) prepara um ataque duplo!`);
            game.isTojiSecondHit = true; 
            await game.performAttack(self, target, true); 
            game.isTojiSecondHit = false; 
            return true; 
        }
        return false;
    }),
    new Card('wind4', 'Minato', 'Damage', [12, 16], 23, 'Ar', 'Ar: Após atacar, Minato tem 30% de chance de realizar um ataque adicional (no mesmo ou em outro alvo).', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === game.selectedAttacker.id && Math.random() < 0.30) {
            game.addLog(`${self.name} (Ar) realiza um ataque adicional devido à sua velocidade!`);
            await game.performAttack(self, target, true); 
            return true;
        }
        return false;
    }),
    new Card('wind5', 'Akali', 'Healer', [10, 12], 31, 'Ar', 'Ar: Quando Akali cura um aliado, esse aliado ganha 70% de chance de esquiva em seu próximo turno.', async (game, self, target) => {
        if (game.isProcessingHeal && self.id === game.selectedAttacker.id && target) {
            game.applyEffect(target, 'EsquivaChance', 1, 0.70); 
            game.addLog(`${self.name} (Ar) concedeu 70% de chance de esquiva a ${target.name}.`);
            game.updateUI();
        }
    }),
    new Card('wind6', 'Zoro', 'Damage', [13, 16], 24, 'Ar', 'Ar: A cada ataque de Zoro aumenta em 1-1 o pr\u00f3prio ataque.', async (game, self, target) => {
    // Este specialEffect será chamado após cada ataque de Zoro
    console.log(`%c[DEBUG ZORO] Habilidade de Zoro verificada. Atacante: %c${self.name}%c.`, 'color: #8B4513;', 'color: yellow;', 'color: #8B4513;'); // Brown

    if (game.isProcessingAttack && self.id === game.selectedAttacker.id) { // Garante que é Zoro e que ele está atacando
        self.attackMin += 1;
        self.attackMax += 1;
        game.addLog(`${self.name} (Vento) aumentou seu ataque em 1! Novo ATK: <span class="math-inline">\{self\.attackMin\}\-</span>{self.attackMax}.`);
        console.log(`%c[DEBUG ZORO] Ataque de Zoro aumentado para: %c${self.attackMin}-${self.attackMax}`, 'color: #8B4513;', 'color: yellow;');
        game.updateUI(); // Atualiza a UI para refletir o novo ataque
        return true;
    }
    return false;
}, 'img/wind6.png'),
new Card('wind7', 'Meimei', 'Healer', [12, 14], 22, 'Ar', 'Ar: Sempre que Meimei cura um aliado, ela causa 4 de dano a todos os inimigos com uma rajada de corvos.', async (game, self, target) => {
        // Este specialEffect será chamado APÓS Meimei realizar uma cura (em game.performHeal)
        console.log(`%c[DEBUG MEIMEI] Habilidade de Meimei (Rajada de Corvos) verificada. Curando: %c${target.name}%c.`, 'color: #20B2AA;', 'color: yellow;', 'color: #20B2AA;'); // Azul-esverdeado para Ar

        // Verifica se a habilidade está sendo ativada após uma cura (game.isProcessingHeal)
        // E se foi a própria Meimei que realizou a cura (self.id === game.selectedAttacker.id)
        if (game.isProcessingHeal && game.selectedAttacker && game.selectedAttacker.id === self.id) {
            game.addLog(`${self.name} (Ar) libera uma rajada de corvos nos inimigos!`);
            
            // Tocar o som da Meimei (opcional, se você criar um audio/Meimei.mp3)
            if (game.meimeiSound) { // Verifique se game.meimeiSound existe
                game.meimeiSound.play();
            } else {
                console.warn("Som da Meimei não configurado.");
            }

            const enemyCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.currentLife > 0);
            
            if (enemyCards.length > 0) {
                for (const enemy of enemyCards) {
                    // Causa 4 de dano a cada inimigo
                    game.dealDamage(enemy, 4, self); // Passa 'self' como atacante para lidar com possíveis defesas do alvo
                    game.addLog(`  ${enemy.name} recebeu 4 de dano da Rajada de Corvos.`);
                    console.log(`%c[DEBUG MEIMEI] ${enemy.name} atingido por 4 de dano da Rajada de Corvos.`, 'color: #20B2AA;');
                }
                game.updateUI(); // Atualiza a UI após todos os danos serem aplicados
                return true;
            } else {
                game.addLog(`${self.name} (Ar) não encontrou inimigos para atingir com a Rajada de Corvos.`);
                console.log(`%c[DEBUG MEIMEI] Nenhum inimigo para Rajada de Corvos.`, 'color: #20B2AA;');
            }
        }
        return false;
    }, 'img/wind7.png'),
    // Dark
   new Card('dark1', 'Hyakkimaru', 'Tank', [3, 5], 60, 'Dark', 'Dark: No início do primeiro turno, perde metade da vida mas concede o range de ataque dele (3-5) a outra criatura Damage aliada.', async (game, self, target) => {
    console.log(`%c[DEBUG HYAKKIMARU] Habilidade de Hyakkimaru verificada. Dono: %c${self.owner}%c, Vida: %c${self.currentLife}%c, ID: %c${self.id}`, 'color: purple;', 'color: yellow;', 'color: purple;', 'color: yellow;', 'color: purple;', 'color: yellow;');

    if (game.currentPhase === 'battle' && self.currentLife > 0 && !self.hasUsedSpecialAbilityOnce) {
        console.log(`%c[DEBUG HYAKKIMARU] Condições de ativação (fase, vida, não usada) são VERDADEIRAS!`, 'color: purple;');

        self.currentLife = Math.ceil(self.currentLife / 2); // Perde metade da vida
        game.addLog(`${self.name} (Dark) sacrificou metade da vida (agora ${self.currentLife} HP).`);
        console.log(`%c[DEBUG HYAKKIMARU] Vida de Hyakkimaru reduzida para: %c${self.currentLife}`, 'color: purple;', 'color: yellow;');

        // >>> ALTERE ESTA LINHA <<<
        const damageAllies = game.getPlayersCards(self.owner).filter(c => c.type === 'Damage' && c.id !== self.id && c.currentLife > 0);
        // >>> FIM DA ALTERAÇÃO <<<

        console.log(`%c[DEBUG HYAKKIMARU] Aliados Damage encontrados (além de Hyakkimaru): %c${damageAllies.map(c => c.name).join(', ') || 'Nenhum'}`, 'color: purple;', 'color: yellow;');

        if (damageAllies.length > 0) { // Verifica se há aliados Damage
            const targetAlly = damageAllies[Math.floor(Math.random() * damageAllies.length)];
            targetAlly.tempAttackBonus = self.attackMax; // Concede o bônus máximo de ataque
            targetAlly.tempAttackBonusSource = self.id; // Marca a fonte do bônus
            game.addLog(`${self.name} (Dark) concedeu um bônus de ataque de ${self.attackMax} a ${targetAlly.name} (criatura Damage)!`); // Ajuste o log
            console.log(`%c[DEBUG HYAKKIMARU] Bônus de ataque de <span class="math-inline">\{self\.attackMax\} dado a %c</span>{targetAlly.name}`, 'color: purple;', 'color: yellow;');
        } else {
            game.addLog(`${self.name} (Dark) não encontrou aliados Damage para conceder bônus.`); // Ajuste o log
            console.log(`%c[DEBUG HYAKKIMARU] Nenhum aliado Damage encontrado para conceder bônus.`, 'color: purple;');
        }
        self.hasUsedSpecialAbilityOnce = true;
        game.updateUI();
        return true;
    } else {
        console.log(`%c[DEBUG HYAKKIMARU] Habilidade NÃO ativada. Detalhes: Fase=%c${game.currentPhase}%c, Vida=%c${self.currentLife}%c, JáUsada=%c${self.hasUsedSpecialAbilityOnce}`, 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;');
    }
    return false;
}),
    new Card('dark2', 'Zeref', 'Tank', [2, 4], 45, 'Dark', 'Dark: Tem 25% de chance de "Amaldiçoar" o inimigo que o atacar. Cartas amaldiçoadas recebem 2 de dano no início de cada turno delas por 2 turnos.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === target.id && Math.random() < 0.25) {
            const attacker = game.selectedAttacker;
            if (attacker) {
                game.applyEffect(attacker, 'Amaldiçoar', 2, 2); 
                game.addLog(`${self.name} (Dark) amaldiçoou ${attacker.name} por 2 turnos!`);
                game.updateUI();
            }
        }
    }),
    new Card('dark3', 'Madara', 'Damage', [16, 19], 21, 'Dark', 'Dark: Sempre que Madara derrota uma criatura inimiga, ele se cura em 5 HP e aumenta seu ataque mínimo e máximo em 2 permanentemente.', async (game, self, target) => {
        if (game.isCardDefeated && self.id === game.selectedAttacker.id && target.currentLife <= 0) {
            game.healCard(self, 5); 
            self.attackMin += 2; 
            self.attackMax += 2; 
            game.addLog(`${self.name} (Dark) devorou a vida de ${target.name}, curou 5 HP e aumentou seu ataque para ${self.attackMin}-${self.attackMax}!`);
            game.updateUI();
        }
    }),
    new Card('dark4', 'Itachi', 'Damage', [13, 16], 24, 'Dark', 'Dark: Pode atacar diretamente qualquer criatura inimiga, ignorando a regra de Tanks.', null),
    new Card('dark5', 'Sung Jin-woo', 'Feiticeiro', [5, 7], 33, 'Dark', 'Dark: Ao iniciar a batalha, concede seu ataque (5-7) ao Tank aliado mais ferido. Habilidade passiva: Ao ter um aliado derrotado, invoca a sombra Igris (ATK 10-13, VIDA 25) no lugar dele (uma vez por partida).', async (game, self, target) => {
    // ESTE specialEffect agora será APENAS para o Buff de Ataque no Tank (ativação: início da batalha)
    console.log(`%c[DEBUG SUNG JIN-WOO - EFFECT] Habilidade de Feiticeiro (BUFF TANK) verificada. Dono: %c${self.owner}%c, Vida: %c${self.currentLife}`, 'color: purple;', 'color: yellow;', 'color: purple;', 'color: yellow;');

    if (game.currentPhase === 'battle' && self.currentLife > 0) {
        console.log(`%c[DEBUG SUNG JIN-WOO - EFFECT] Condi\u00e7\u00f5es BUFF TANK s\u00e3o VERDADEIRAS!`, 'color: purple;');

        const tankAllies = game.getPlayersCards(self.owner).filter(c => c.type === 'Tank' && c.id !== self.id && c.currentLife > 0);
        console.log(`%c[DEBUG SUNG JIN-WOO - EFFECT] Aliados Tank encontrados: %c${tankAllies.map(c => c.name).join(', ') || 'Nenhum'}`, 'color: purple;', 'color: yellow;');

        if (tankAllies.length > 0) {
            const targetTank = tankAllies.sort((a, b) => (a.currentLife / a.maxLife) - (b.currentLife / b.maxLife))[0]; 
            targetTank.tempAttackBonus += self.attackMax; 
            targetTank.tempAttackBonusSource = self.id; 
            game.addLog(`${self.name} (Dark) concedeu um b\u00f4nus de ataque de ${self.attackMax} a ${targetTank.name} (Tank)!`);
            console.log(`%c[DEBUG SUNG JIN-WOO - EFFECT] Buff de ataque dado a ${targetTank.name}.`, 'color: purple;');
        } else {
            game.addLog(`${self.name} (Dark) n\u00e3o encontrou Tank aliado para conceder b\u00f4nus de ataque.`);
            console.log(`%c[DEBUG SUNG JIN-WOO - EFFECT] Nenhum Tank aliado encontrado para buff.`, 'color: purple;');
        }
        game.updateUI(); 
        // Note: hasUsedSpecialAbilityOnce não é definido aqui, pois é para a ressurreição
        return true;
    } else {
        console.log(`%c[DEBUG SUNG JIN-WOO - EFFECT] BUFF TANK N\u00c3O ativado. Detalhes: Fase=%c${game.currentPhase}%c, Vida=%c${self.currentLife}`, 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;');
    }
    return false;
}),

new Card('dark6', 'Merlin [Dark]', 'Healer', [11, 12], 30, 'Dark', 'Dark: Para curar um aliado, ela drena a mesma quantidade de vida de um inimigo aleat\u00f3rio.', async (game, self, target) => {
    // Este specialEffect será chamado quando Merlin for usada para curar
    console.log(`%c[DEBUG MERLIN] Habilidade de Merlin (DRENAR CURA) verificada. Curando: %c${target.name}%c.`, 'color: darkviolet;', 'color: yellow;', 'color: darkviolet;');

    if (game.currentPhase === 'battle' && self.currentLife > 0 && target && target.currentLife > 0) { // Garante que a batalha está ativa e os alvos são válidos
        let healAmount = Math.floor(Math.random() * (self.attackMax - self.attackMin + 1)) + self.attackMin;
        console.log(`%c[DEBUG MERLIN] Valor base de cura/dreno: %c${healAmount}`, 'color: darkviolet;', 'color: yellow;');

        // Cura o aliado (target)
        game.healCard(target, healAmount);
        game.addLog(`${self.name} (Dark) curou ${healAmount} de vida de ${target.name}. Vida: ${target.currentLife}`);
        
        // Drena de um inimigo aleat\u00f3rio
        const enemyCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.currentLife > 0);
        if (enemyCards.length > 0) {
            const randomEnemyTarget = enemyCards[Math.floor(Math.random() * enemyCards.length)];
            game.dealDamage(randomEnemyTarget, healAmount); // Causa o mesmo dano que curou
            game.addLog(`${self.name} (Dark) drenou ${healAmount} de vida de ${randomEnemyTarget.name}!`);
            console.log(`%c[DEBUG MERLIN] Drenou ${healAmount} de vida de ${randomEnemyTarget.name}.`, 'color: darkviolet;', 'color: yellow;');
        } else {
            game.addLog(`${self.name} (Dark) n\u00e3o encontrou inimigos para drenar vida.`);
            console.log(`%c[DEBUG MERLIN] Nenhum inimigo para drenar.`, 'color: darkviolet;');
        }
        
        game.updateUI(); // Atualiza a UI ap\u00f3s cura e dreno
        return true;
    } else {
        console.log(`%c[DEBUG MERLIN] Habilidade N\u00c3O ativada. Detalhes: Fase=%c${game.currentPhase}%c, VidaMerlin=%c${self.currentLife}%c, AlvoV\u00e1lido=%c${target && target.currentLife > 0}`, 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;');
    }
    return false;
}, 'img/dark6.png'),
 new Card('dark7', 'Sukuna', 'Damage', [8, 10], 22, 'Dark', 'Dark: Ataca junto de outro aliado. Quando ativado, Sukuna faz um som.', async (game, self, target) => {
        // Este specialEffect será chamado APÓS a carta principal ter atacado
        // E só se a condição de "atacar junto" for cumprida
        console.log(`%c[DEBUG SUKUNA] Habilidade de Sukuna (Ataque Conjunto) verificada. Atacante: %c${self.name}%c.`, 'color: #8B0000;', 'color: yellow;', 'color: #8B0000;'); // Marrom Escuro para Dark

        // Checa se quem está chamando o specialEffect é o Sukuna e se ele não atacou ainda neste turno como parte da habilidade principal
        // O "game.isProcessingAttack" deve ser 'true' quando a habilidade primária está acontecendo.
        // É importante que o specialEffect de Sukuna não seja chamado a cada ataque, mas sim
        // quando a CARTA PRINCIPAL ataca e Sukuna é o "segundo" atacante.
        // A lógica de ativação real será no game.js (performAttack)
        if (game.isProcessingAttack && game.selectedAttacker && game.selectedAttacker.owner === self.owner) {
            // Garante que Sukuna não está tentando atacar consigo mesmo como o 'selectedAttacker' principal
            // E que ele ainda não atacou neste turno via sua habilidade
            if (game.selectedAttacker.id !== self.id && !self.hasAttackedThisTurn) {
                 // Verifica se há outro aliado vivo que não seja o próprio Sukuna e não seja o alvo do ataque
                const otherAllies = game.getPlayersCards(self.owner).filter(c => c.currentLife > 0 && c.id !== self.id && c.id !== target.id);
                if (otherAllies.length > 0) {
                    // Tocar o som de Sukuna
                    if (game.sukunaSound) {
                        game.sukunaSound.play();
                    } else {
                        console.warn("Som do Sukuna não configurado.");
                    }
                    game.addLog(`${self.name} (Dark) ataca junto com ${game.selectedAttacker.name}!`);
                    // Realiza o ataque de Sukuna no mesmo alvo
                    await game.performAttack(self, target, true); // Passa 'true' para isSecondHit para evitar loops
                    self.hasAttackedThisTurn = true; // Marca Sukuna como tendo agido neste turno
                    game.updateUI();
                    return true;
                }
            }
        }
        return false;
    }, 'img/dark7.png'), // Certifique-se de ter 'img/dark7.png'
// js/card.js - dentro do specialEffect do Naruto ('light2')
new Card('light1', 'Hashirama', 'Tank', [2, 4], 50, 'Luz', 'Luz: Quando Hashirama recebe dano, ele tem 50% de chance de reduzir esse dano em 5.', async (game, self, target) => {
    if (game.isProcessingAttack && self.id === target.id && Math.random() < 0.50) {
            game.addLog(`${self.name} (Terra) reduziu 5 de dano recebido!`);
            return -5; 
        }
        return 0;
    }),
new Card('light2', 'Naruto', 'Tank', [4, 5], 52, 'Luz', 'Luz: No início do turno do jogador, Naruto concede 7 de Escudo (absorve os próximos 7 de dano) a todos os aliados na fileira de trás.', async (game, self, target) => {
    console.log(`[CHECKPOINT 5] Dentro do specialEffect do Naruto. Dono: ${self.owner}, Vida: ${self.currentLife}, ID: ${self.id}`);

    // >>> ESTA É A LINHA QUE DEVE ESTAR CORRETA <<<
    if (game.currentPhase === 'battle' && self.currentLife > 0) { // CONDIÇÃO DO IF
    // >>> FIM DA LINHA <<<

        console.log(`[CHECKPOINT 6] Condições de ativação do Naruto (fase, vida) são VERDADEIRAS!`);

        const allyCards = game.getPlayersCards(self.owner).filter(c => c.currentLife > 0 && c.id !== self.id); 
        const backRowAllies = allyCards.filter(c => ['pos3', 'pos4', 'pos5'].includes(c.position)); 

        console.log(`[CHECKPOINT 7] Aliados na fileira de trás encontrados:`, backRowAllies.map(a => a.name));

        if (backRowAllies.length === 0) {
             console.log(`[CHECKPOINT 8] Nenhum aliado na fileira de trás para Naruto conceder escudo.`);
        }

        for (const ally of backRowAllies) {
            game.applyEffect(ally, 'Escudo', -1, 7); 
            game.addLog(`${self.name} (Luz) concedeu 7 de Escudo a ${ally.name}.`);
            console.log(`[CHECKPOINT 9] Escudo aplicado a: ${ally.name}`);
        }
        game.updateUI();
    } else {
        console.log(`%c[CHECKPOINT 10] Condições de ativação do Naruto são FALSAS. Detalhes: Fase=%c${game.currentPhase}%c, VidaNaruto=%c${self.currentLife}`, 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;'); // Mensagem detalhada e colorida
    }
}),
    new Card('light3', 'Gojo', 'Damage', [14, 17], 22, 'Luz', 'Luz: Tem 20% de dar o dano dobrado, sem aplicar o multiplicador ofensivo de dano de elemento para ele.', async (game, self, target) => {
        if (game.isProcessingAttack && self.id === game.selectedAttacker.id && Math.random() < 0.20) {
            game.addLog(`${self.name} (Luz) DOBROU seu dano!`);
            return 2; 
        }
        return 1; 
    }),
    new Card('light4', 'Kakashi', 'Damage', [12, 15], 23, 'Luz', 'Luz: O ataque de Kakashi ignora todos os efeitos de "Escudo" e "Esquiva" do alvo.', null),
    new Card('light5', 'Julius Novachrono', 'Healer', [12, 15], 30, 'Luz', 'Luz: Uma vez por partida, Julius Novachrono pode escolher um aliado para remover todos os efeitos negativos (ex: Amaldiçoar, Queimar, Enraizar, Atordoar) dele e curá-lo em 10 HP.', async (game, self, target) => {
        if (game.currentPhase === 'battle' && game.currentPlayerId === self.owner && !self.hasUsedSpecialAbilityOnce) {
            if (target) {
                 let effectsRemoved = false;
                const negativeEffects = ['Amaldiçoar', 'Queimar', 'Enraizar', 'Atordoar', 'EsquivaChance', 'Partitura']; // <--- Adicione 'Partitura' aqui
                for (const effectName of negativeEffects) {
                    if (target.effectsApplied[effectName]) {
                        delete target.effectsApplied[effectName];
                        if (effectName === 'Amaldiçoar' || effectName === 'Enraizar' || effectName === 'Atordoar') {
                            target.canAttack = true;
                        }
                        effectsRemoved = true;
                    }
                }
                if (effectsRemoved) {
                    game.addLog(`${self.name} (Luz) removeu efeitos negativos de ${target.name}.`);
                }
                game.healCard(target, 10);
                self.hasUsedSpecialAbilityOnce = true;
                game.addLog(`${self.name} (Luz) curou 10 HP de ${target.name}.`);
                game.updateUI();
                return true; 
            }
        }
        return false; 
    }),
    new Card('light6', 'Yugi Muto', 'Feiticeiro', [5, 7], 33, 'Luz', 'Luz: Ao iniciar a batalha, se transforma em Faraó Yami Yugi (muda imagem/nome) e concede 5 de vida máxima ao Tank aliado. Habilidade passiva: Ao ter um aliado derrotado, invoca o Mago Negro (ATK 5-7, VIDA 15, Dark, causa 5 de dano aos inimigos da fileira de trás) no lugar dele (uma vez por partida).', async (game, self, target) => {
    // Este specialEffect ser\u00e1 APENAS para a transforma\u00e7\u00e3o e o buff de vida no Tank (ativa\u00e7\u00e3o: in\u00edcio da batalha)
    console.log(`%c[DEBUG YUGI - EFFECT] Habilidade de Feiticeiro (TRANSFORMAÇÃO + BUFF TANK) verificada. Dono: %c${self.owner}%c, Vida: %c${self.currentLife}`, 'color: gold;', 'color: yellow;', 'color: gold;', 'color: yellow;');

    if (game.currentPhase === 'battle' && self.currentLife > 0 && !self.hasUsedSpecialAbilityOnce) { // Ativa só uma vez por partida
        console.log(`%c[DEBUG YUGI - EFFECT] Condi\u00e7\u00f5es TRANSFORMAÇÃO + BUFF TANK s\u00e3o VERDADEIRAS!`, 'color: gold;');

        // 1. Transforma\u00e7\u00e3o
        self.name = 'Faraó Yami Yugi [Dark]'; // Muda o nome da carta
        self.id = 'yami_yugi'; // Muda o ID para uma nova imagem (você precisa de img/yami_yugi.png)
        self.element = 'Dark'; // Ele se torna Dark ap\u00f3s a transforma\u00e7\u00e3o (se quiser)
        game.addLog(`${self.name} se transformou em Fara\u00f3 Yami Yugi e muda seu elemento para Dark!`);

        // Tocar som de transforma\u00e7\u00e3o (você precisar\u00e1 de um arquivo de \u00e1udio, ex: 'audio/transformation.mp3')
        if (game.transformationSound) { // Verifique se o som est\u00e1 definido em game.init()
            game.transformationSound.play();
        } else {
            console.warn("Som de transforma\u00e7\u00e3o n\u00e3o configurado.");
        }

        // 2. Concede vida m\u00e1xima ao Tank aliado
        const tankAllies = game.getPlayersCards(self.owner).filter(c => c.type === 'Tank' && c.id !== self.id && c.currentLife > 0);
        console.log(`%c[DEBUG YUGI - EFFECT] Aliados Tank encontrados: %c${tankAllies.map(c => c.name).join(', ') || 'Nenhum'}`, 'color: gold;', 'color: yellow;');

        if (tankAllies.length > 0) {
            const targetTank = tankAllies.sort((a, b) => (a.currentLife / a.maxLife) - (b.currentLife / b.maxLife))[0]; 
            targetTank.maxLife += 5; // Aumenta a vida m\u00e1xima
            targetTank.currentLife += 5; // Cura tamb\u00e9m, para n\u00e3o ficar com vida desproporcional
            game.addLog(`${self.name} concedeu 5 de vida m\u00e1xima a ${targetTank.name} (Tank)!`);
            console.log(`%c[DEBUG YUGI - EFFECT] ${targetTank.name} ganhou 5 de vida m\u00e1xima.`, 'color: gold;');
        } else {
            game.addLog(`${self.name} n\u00e3o encontrou Tank aliado para conceder vida m\u00e1xima.`);
            console.log(`%c[DEBUG YUGI - EFFECT] Nenhum Tank aliado encontrado para buff de vida.`, 'color: gold;');
        }

       self.hasUsedTransformationAbilityOnce = true; // Marca a habilidade de transforma\u00e7\u00e3o como usada
        game.reRenderCard(self); // For\u00e7a a re-renderiza\u00e7\u00e3o de Yugi para mostrar a nova imagem e nome
        game.updateUI(); // Atualiza a UI geral
        return true;
    } else {
        console.log(`%c[DEBUG YUGI - EFFECT] TRANSFORMAÇÃO N\u00c3O ativada. Detalhes: Fase=%c${game.currentPhase}%c, Vida=%c${self.currentLife}%c, J\u00e1Usada=%c${self.hasUsedSpecialAbilityOnce}`, 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;', 'color: red;', 'color: yellow;');
    }
    return false;
    
}),
new Card('light7', 'Goku', 'Damage', [6, 8], 22, 'Luz', 'Luz: Ataca todos os inimigos com seu Kamehameha.', async (game, self, target) => {
    // Este specialEffect será chamado APÓS a fase de cálculo de dano inicial em performAttack
    // Ele vai aplicar dano a TODOS os inimigos.
    console.log(`%c[DEBUG GOKU] Habilidade de Goku (Kamehameha) ativada!`, 'color: orange;', 'font-weight: bold;');

    if (game.isProcessingAttack && self.id === game.selectedAttacker.id) { // Garante que \u00e9 Goku e que ele est\u00e1 atacando
        game.addLog(`${self.name} (Luz) lan\u00e7a seu Kamehameha!`);

        const opponentCards = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => c.currentLife > 0);

        if (opponentCards.length > 0) {
            for (const enemy of opponentCards) {
                // O dano para cada inimigo será dentro do range de ataque de Goku
                let damageToEnemy = Math.floor(Math.random() * (self.attackMax - self.attackMin + 1)) + self.attackMin;

                // Aplicar multiplicador elemental (se Gojo não dobrou o dano)
                let elementalMultiplier = 1;
                const attackerElement = self.element;
                const targetElement = enemy.element;
                const elementalAdvantages = { 'Fogo': 'Ar', 'Ar': 'Terra', 'Terra': 'Agua', 'Agua': 'Fogo' };
                const darkLightAdvantage = { 'Dark': 'Luz', 'Luz': 'Dark' };

                // Nota: Se Gojo duplicar o dano, ele j\u00e1 est\u00e1 em performAttack, ent\u00e3o n\u00e3o reaplica aqui.
                // Para Goku, o dano \u00e9 fixo por cada alvo do Kamehameha, ent\u00e3o n\u00e3o depende de gojoDoubleDamage.
                if (elementalAdvantages[attackerElement] === targetElement) {
                    elementalMultiplier = 1.5;
                } else if (elementalAdvantages[targetElement] === attackerElement) {
                    elementalMultiplier = 1 / 1.5;
                } else if (darkLightAdvantage[attackerElement] === targetElement) {
                    elementalMultiplier = 1.5;
                } else if (darkLightAdvantage[targetElement] === attackerElement) {
                    elementalMultiplier = 1 / 1.5;
                }
                damageToEnemy = Math.floor(damageToEnemy * elementalMultiplier);

                game.dealDamage(enemy, damageToEnemy, false); // false para n\u00e3o aplicar multiplicador de novo
                game.addLog(`\u00a0\u00a0${enemy.name} recebeu ${damageToEnemy} de dano do Kamehameha!`);
                console.log(`%c[DEBUG GOKU] ${enemy.name} atingido por ${damageToEnemy} de dano.`, 'color: orange;');
            }
            game.updateUI(); // Atualiza a UI ap\u00f3s todos os danos
        } else {
            game.addLog(`${self.name} (Luz) n\u00e3o encontrou inimigos para atingir com Kamehameha.`);
            console.log(`%c[DEBUG GOKU] Nenhum inimigo para Kamehameha.`, 'color: orange;');
        }
        return true;
    }
    console.log(`%c[DEBUG GOKU] Habilidade n\u00e3o ativada (n\u00e3o \u00e9 Goku atacando).`, 'color: orange;');
    return false;
}, 'img/light7.png'),
];

export const igrisCardData = {
    id: 'igris', // ID único para Igris
    name: 'Igris (Sombra)',
    image: 'img/igris.png',
    type: 'Damage', // Ou o tipo que você preferir para ele
    attackRange: [10, 13],
    maxLife: 25,
    element: 'Dark',
    effectDescription: 'Dark: Uma sombra leal invocada por Sung Jin-woo.',
    specialEffect: null // Igris não tem um efeito especial próprio complexo
};
export const magoNegroCardData = {
    id: 'mago_negro', // ID único para Mago Negro
    name: 'Mago Negro [Dark] (Evoca\u00e7\u00e3o)',
    image: 'img/mago_negro.png',
    type: 'Damage', 
    attackRange: [5, 7],
    maxLife: 15,
    element: 'Dark', // User specified Dark
    effectDescription: 'Causa 5 de dano aos inimigos da fileira de tr\u00e1s quando invocado (uma vez).',
    specialEffect: async (game, self, target) => { // Efeito que ativa na invoca\u00e7\u00e3o
        if (!self.hasUsedSpecialAbilityOnce) { // Garante que ative apenas uma vez por invoca\u00e7\u00e3o
            console.log(`%c[DEBUG MAGO NEGRO] Habilidade de invoca\u00e7\u00e3o ativada: Causa dano em \u00e1rea!`, 'color: darkblue;');
            const enemyBackRow = game.getPlayersCards(game.getOpponent(self.owner)).filter(c => ['pos3', 'pos4', 'pos5'].includes(c.position) && c.currentLife > 0);

            if (enemyBackRow.length > 0) {
                game.addLog(`${self.name} (Evoca\u00e7\u00e3o) lan\u00e7a um ataque sombrio!`);
                for (const enemy of enemyBackRow) {
                    game.dealDamage(enemy, 5); // Causa 5 de dano
                    game.addLog(`\u00a0\u00a0${enemy.name} (inimigo) recebeu 5 de dano do Mago Negro.`);
                }
                game.updateUI();
            } else {
                game.addLog(`${self.name} (Evoca\u00e7\u00e3o) n\u00e3o encontrou inimigos na fileira de tr\u00e1s para atacar.`);
            }
            self.hasUsedSpecialAbilityOnce = true; // Marca o efeito on-summon como usado
            return true;
        }
        return false;
    }, // <-- Adiciona a vírgula aqui
};
    export const gonAdultoCardData = {
    id: 'gonadulto', // ID único para Gon Adulto
    name: 'Gon Adulto',
    image: 'img/gonadulto.png', // Imagem do Gon Adulto
    type: 'Damage',
    attackRange: [14, 18],
    maxLife: 25,
    element: 'Terra', // Mantém o elemento Terra
    effectDescription: 'Terra: Uma forma liberada de poder insano.',
    specialEffect: null // Gon Adulto não tem um efeito especial on-transform ou por turno, ele é pura estatística

};