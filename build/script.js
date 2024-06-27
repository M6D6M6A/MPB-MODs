addWindow('MPB Utils', function () {
    ImGui.Checkbox('100% Wild shiny', data.getAccess('WildShiny100p', false, true));
    // ImGui.Checkbox('100% All shiny', data.getAccess('AllShiny100p', false, true));
}, {
    persistentOpen: true,
});
function setMaxShinyRate(battleScene) {
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
var shinyHook = function (phase) {
    var battleScene = phase.battleScene || getBattleScene();
    if (data.getData('WildShiny100p', false, true)) {
        setMaxShinyRate(battleScene);
    }
};
hook('EncounterPhase', shinyHook);
