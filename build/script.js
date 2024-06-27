addWindow('MPB Utils', function () {
    ImGui.Checkbox('100% Wild shiny', data.getAccess('WildShiny100p', false, true));
    // ImGui.Checkbox('100% All shiny', data.getAccess('AllShiny100p', false, true));
}, {
    persistentOpen: true,
});
function setMaxShinyRate(battleScene) {
    // Credit: Mike
    var oldAddEnemyPokemon = battleScene.addEnemyPokemon;
    battleScene.addEnemyPokemon = function (species, level, trainerSlot, boss, dataSource, postProcess) {
        if (boss === void 0) { boss = false; }
        var pokemon = oldAddEnemyPokemon.call(battleScene, species, level, trainerSlot, boss, dataSource, postProcess);
        log(pokemon);
        if (battleScene && data.getData('WildShiny100p', false, true)) {
            pokemon.shiny = true;
            //pokemon.variant = something for shiny variants
        }
        return pokemon;
    };
    var modifiers = battleScene.modifiers;
    var searchString = 'modifierType:ModifierType.SHINY_CHARM';
    var maxStackCount = 20;
    var index = modifiers.findIndex(function (_a) {
        var localeKey = _a.type.localeKey;
        return localeKey === searchString;
    });
    var addItemToPlayer = function (newItemModifier, playSound, instant) {
        if (playSound === void 0) { playSound = true; }
        if (instant === void 0) { instant = true; }
        return battleScene.updateModifiers(true, instant).then(function () { return battleScene.addModifier(newItemModifier, false, playSound, false, instant).then(function () { return battleScene.updateModifiers(true, instant); }); });
    };
    if (index === -1) {
        var shinyCharmModifier = new PokeRogue.modifier.ShinyRateBoosterModifier(PokeRogue.modifier.modifierTypes.SHINY_CHARM());
        return addItemToPlayer(shinyCharmModifier, false, true).then(function () {
            index = modifiers.findIndex(function (_a) {
                var localeKey = _a.type.localeKey;
                return localeKey === searchString;
            });
            if (index === -1) {
                console.error('Error: Modifier was not added correctly.');
                return;
            }
            log("Added new object with stack count ".concat(maxStackCount));
            modifiers[index].stackCount = maxStackCount;
            return battleScene.updateModifiers(true, true).then(function () { return log("Updated stack count to ".concat(maxStackCount)); });
        });
    }
    if (modifiers[index].stackCount !== maxStackCount) {
        modifiers[index].stackCount = maxStackCount;
        return battleScene.updateModifiers(true, true).then(function () { return log("Found at index: ".concat(index, ". Updated stack count to ").concat(maxStackCount)); });
    }
    else {
        log("Wild shiny is already at max.");
    }
}
function makeEnemiesShiny() {
    var enemyParty = getBattleScene().currentBattle.enemyParty;
    enemyParty.forEach(function (v, i, a) {
        data = a[i];
        data.shiny = true;
        data.variant = Math.floor(Math.random() * 3);
        // data.changeForm(Math.floor(Math.random() * data.species.forms.length));
        data.changeForm(data.species.forms.length === 0 ? 0 : Math.floor(Math.random() * (data.species.forms.length)));
        log(data);
        a[i] = data;
    });
}
var shinyHook = function (phase) {
    var battleScene = phase.battleScene || getBattleScene();
    // if (battleScene && battleScene.currentPhase && battleScene.currentPhase.loaded && battleScene.currentPhase.loaded === true) {
    //     if (data.getData('WildShiny100p', false, true)) {
    //         setMaxShinyRate(battleScene);
    //     }
    // } else {
    if (battleScene && data.getData('WildShiny100p', false, true)) {
        setMaxShinyRate(battleScene);
        var oldDoEncounter_1 = phase.doEncounter; // Save the original function
        // Define the new function
        phase.doEncounter = function () {
            makeEnemiesShiny();
            oldDoEncounter_1.call(phase); // Call the original function within the context of phase
        };
    }
    // }
};
var titleHook = function (phase) {
    // cleanup items in title screen becouse of shiny mod
    var battleScene = getBattleScene();
    battleScene.modifiers = [];
    battleScene.updateModifiers(true, true);
};
var NextEncounterHook = function (phase) {
    makeEnemiesShiny();
};
hook('EncounterPhase', shinyHook); // Buggy because of starter select!
hook('TitlePhase', titleHook); // Buggy because of starter select!
hook('NextEncounterPhase', NextEncounterHook); // Buggy because of starter select!
