function checkAndExecuteKiluaPassive(attacker) {
    if (attacker.name !== 'Kilua') return false;
    if (attacker.passiveUsed) return false;
    
    // Verifica se há inimigos com 5 ou menos de vida
    const weakEnemies = getEnemyCards(attacker).filter(enemy => enemy.health <= 5 && enemy.health > 0);
    
    if (weakEnemies.length > 0) {
        // Marca que a passiva foi usada
        attacker.passiveUsed = true;
        
        // Executa o inimigo mais fraco
        const target = weakEnemies.reduce((weakest, enemy) => 
            enemy.health < weakest.health ? enemy : weakest
        );
        
        showMessage(`${attacker.name} ativa sua passiva de execução em ${target.name}!`);
        
        // Remove o inimigo executado
        removeCardFromField(target);
        
        // Transforma o Killua
        setTimeout(() => {
            transformKillua(attacker);
        }, 1500);
        
        return true;
    }
    
    return false;
}