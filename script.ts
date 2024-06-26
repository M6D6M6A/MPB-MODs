addWindow(
    'MPB Utils',
    () => {
        const battleScene = getBattleScene();
        ImGui.Checkbox('100% Wild shiny', data.getAccess('WildShiny100p', false, true));

        if (battleScene && battleScene.currentBattle && battleScene.currentBattle.waveIndex && battleScene.currentBattle.waveIndex > 0 && data.getData('WildShiny100p', false, true)) {
            function addItemToPlayer(newItemModifier, playSound = true, instant = true) {
                return battleScene.updateModifiers(true, instant).then(() => battleScene.addModifier(newItemModifier, false, playSound, false, instant).then(() => battleScene.updateModifiers(true, instant)));
            }

            const setMaxShinyRate = async () => {
                const modifiers = battleScene.modifiers;
                const searchString = 'modifierType:ModifierType.SHINY_CHARM';
                const maxStackCount = 20;

                let index = modifiers.findIndex(({ type: { localeKey } }) => localeKey === searchString);

                if (index === -1) {
                    const shinyCharmModifier = new PokeRogue.modifier.ShinyRateBoosterModifier(PokeRogue.modifier.modifierTypes.SHINY_CHARM());
                    await addItemToPlayer(shinyCharmModifier, false, true);
                    index = modifiers.findIndex(({ type: { localeKey } }) => localeKey === searchString);
                    if (index === -1) {
                        console.error('Error: Modifier was not added correctly.');
                        return;
                    }
                    log(`Added new object with stack count ${maxStackCount}`);
                }

                if (modifiers[index].stackCount !== maxStackCount) {
                    modifiers[index].stackCount = maxStackCount;
                    await battleScene.updateModifiers(true, true);
                    log(`Found at index: ${index}. Updated stack count to ${maxStackCount}`);
                } else {
                    log(`Wild shiny is allready at`);
                }
            };

            setMaxShinyRate();
        }
    },
    {
        persistentOpen: true,
    }
);
