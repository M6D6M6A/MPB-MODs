addWindow(
    'MPB Utils',
    () => {
        ImGui.Checkbox('100% Wild shiny', data.getAccess('WildShiny100p', false, true));
        // ImGui.Checkbox('100% All shiny', data.getAccess('AllShiny100p', false, true));
    },
    {
        persistentOpen: true,
    }
);

function setMaxShinyRate(battleScene) {
    // Credit: Mike
    let oldAddEnemyPokemon = battleScene.addEnemyPokemon;

    battleScene.addEnemyPokemon = (species: PokeRogue.data.PokemonSpecies, level: number, trainerSlot: PokeRogue.data.TrainerSlot, boss: boolean = false, dataSource?: PokeRogue.system.PokemonData, postProcess?: (enemyPokemon: PokeRogue.field.EnemyPokemon) => void): PokeRogue.field.EnemyPokemon => {
        const pokemon: PokeRogue.field.EnemyPokemon = oldAddEnemyPokemon.call(battleScene, species, level, trainerSlot, boss, dataSource, postProcess);
        log(pokemon);
        if (battleScene && data.getData('WildShiny100p', false, true)) {
            pokemon.shiny = true;
            //pokemon.variant = something for shiny variants
        }
        return pokemon;
    };

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

function makeEnemiesShiny() {
    let enemyParty = getBattleScene().currentBattle.enemyParty;
    enemyParty.forEach((v, i, a) => {
        data = a[i];
        data.shiny = true;
        data.variant = Math.floor(Math.random() * 3);
        // data.changeForm(Math.floor(Math.random() * data.species.forms.length));
        data.changeForm(data.species.forms.length === 0 ? 0 : Math.floor(Math.random() * (data.species.forms.length)));
        log(data);

        a[i] = data;
    });
}

const shinyHook = (phase) => {
    let battleScene = phase.battleScene || getBattleScene();

    // if (battleScene && battleScene.currentPhase && battleScene.currentPhase.loaded && battleScene.currentPhase.loaded === true) {
    //     if (data.getData('WildShiny100p', false, true)) {
    //         setMaxShinyRate(battleScene);
    //     }
    // } else {
    if (battleScene && data.getData('WildShiny100p', false, true)) {
        setMaxShinyRate(battleScene);
        const oldDoEncounter = phase.doEncounter; // Save the original function

        // Define the new function
        phase.doEncounter = () => {
            makeEnemiesShiny()
            oldDoEncounter.call(phase); // Call the original function within the context of phase
        };
    }
    // }
};

const titleHook = (phase) => {
    // cleanup items in title screen becouse of shiny mod
    let battleScene = getBattleScene();
    battleScene.modifiers = [];
    battleScene.updateModifiers(true, true);
};

const NextEncounterHook = (phase) => {
    makeEnemiesShiny()
};

hook('EncounterPhase', shinyHook); // Buggy because of starter select!
hook('TitlePhase', titleHook); // Buggy because of starter select!
hook('NextEncounterPhase', NextEncounterHook); // Buggy because of starter select!
