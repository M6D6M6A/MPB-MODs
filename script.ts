addWindow(
    'MPB Utils',
    () => {
        ImGui.Checkbox('100% Wild shiny', data.getAccess('WildShiny100p', false, true));
    },
    {
        persistentOpen: true,
    }
);

function setMaxShinyRate(battleScene) {
    const modifiers = battleScene.modifiers;
    const searchString = 'modifierType:ModifierType.SHINY_CHARM';
    const maxStackCount = 20;

    let index = modifiers.findIndex(({ type: { localeKey } }) => localeKey === searchString);

    const addItemToPlayer = (newItemModifier, playSound = true, instant = true) => {
        return battleScene.updateModifiers(true, instant).then(() => battleScene.addModifier(newItemModifier, false, playSound, false, instant).then(() => battleScene.updateModifiers(true, instant)));
    };

    if (index === -1) {
        const shinyCharmModifier = new PokeRogue.modifier.ShinyRateBoosterModifier(PokeRogue.modifier.modifierTypes.SHINY_CHARM());
        return addItemToPlayer(shinyCharmModifier, false, true).then(() => {
            index = modifiers.findIndex(({ type: { localeKey } }) => localeKey === searchString);
            if (index === -1) {
                console.error('Error: Modifier was not added correctly.');
                return;
            }
            log(`Added new object with stack count ${maxStackCount}`);
            modifiers[index].stackCount = maxStackCount;
            return battleScene.updateModifiers(true, true).then(() => log(`Updated stack count to ${maxStackCount}`));
        });
    }

    if (modifiers[index].stackCount !== maxStackCount) {
        modifiers[index].stackCount = maxStackCount;
        return battleScene.updateModifiers(true, true).then(() => log(`Found at index: ${index}. Updated stack count to ${maxStackCount}`));
    } else {
        log(`Wild shiny is already at max.`);
    }
}

function makeEnemiesShiny(phase) {
    let battleScene = phase.battleScene || getBattleScene();
    let enemyParty = battleScene.currentBattle.enemyParty;
    enemyParty.forEach((v, i, a) => {
        let pokeData = a[i];
        pokeData.shiny = true;
        pokeData.variant = Math.floor(Math.random() * 3);
        pokeData.changeForm(Math.floor(Math.random() * pokeData.species.forms.length));
        log(pokeData);

        a[i] = pokeData;
    });
}

const shinyHook = (phase) => {
    let battleScene = phase.battleScene || getBattleScene();

    if (battleScene && data.getData('WildShiny100p', false, true)) {
        setMaxShinyRate(battleScene);
        const oldDoEncounter = phase.doEncounter; // Save the original function

        // Define the new function
        phase.doEncounter = () => {
            makeEnemiesShiny(phase)
            oldDoEncounter.call(phase); // Call the original function within the context of phase
        };
    }
};

const titleHook = (phase) => {
    // cleanup items in title screen becouse of shiny mod
    let battleScene = phase.battleScene || getBattleScene();
    battleScene.modifiers = [];
    battleScene.updateModifiers(true, true);
};

const NextEncounterHook = (phase) => {
    if (data.getData('WildShiny100p', false, true)) {
        makeEnemiesShiny(phase)
    }
};

hook('EncounterPhase', shinyHook);
hook('TitlePhase', titleHook);
hook('NextEncounterPhase', NextEncounterHook);
