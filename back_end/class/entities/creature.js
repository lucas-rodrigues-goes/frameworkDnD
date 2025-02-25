"use strict";
try {

    var Creature = class extends Entity {

        //=====================================================================================================
        // Default Parameters
        //=====================================================================================================

        #name = "unnamed"
        #type = ""
        #race = ""
        #classes = {}
        #experience = 0
        #ability_scores = {
            "strength": 10, "dexterity": 10, "constitution": 10,
            "wisdom": 10, "intelligence": 10, "charisma": 10,
        }
        #health = 10
        #speed = {
            "walk":30,
            "climb":15,
            "swim":15,
            "fly":0,
            "burrow":0,
        }
        #resources = {
            "mana": {
                "current": 0,
                "maximum": 0
            },
        }
        #features = {
            "all": [], "racial": [], "feat": [],
            "barbarian": [], "bard": [], "cleric": [],
            "druid": [], "fighter": [], "monk": [],
            "paladin": [], "ranger": [], "rogue": [],
            "sorcerer": [], "warlock": [], "wizard": []
        }
        #proficiencies = {}
        #spells = {
            "bard": {
                "known": []
            },
            "cleric": {
                "always_prepared": [],
                "memorized": []
            },
            "druid": {
                "always_prepared": [],
                "memorized": []
            },
            "paladin": {
                "always_prepared": [],
                "memorized": []
            },
            "ranger": {
                "known": []
            },
            "sorcerer": {
                "known": []
            },
            "warlock": {
                "known": []
            },
            "wizard": {
                "known": [],
                "always_prepared": [],
                "memorized": []
            }
        }
        #conditions = {}
        #equipment = {
            "head": null,
            "body": null,
            "hands": null,
            "belt":null,
            "feet": null,
            "amulet": null,
            "right ring": null,
            "left ring": null,
            "cape": null,
            "ammunition": null,
            "primary main hand": null,
            "primary off hand": null,
            "secondary main hand": null,
            "secondary off hand": null
        }
        #inventory = Array.from({ length: 25 }, () => null);


        //=====================================================================================================
        // Methods
        //=====================================================================================================

        create_character({name, type, race, ability_scores}) {

            // Ability Scores
            for (const [score, value] of Object.entries(ability_scores)) {
                this.set_ability_score(score, value)
            }

            // Set basic information
            this.name = name
            this.type = type
            this.race = race
            

            // Fill health
            this.health = this.max_health
        }

        short_rest(hours) {
            // Health
            this.health = (this.max_health / 4) * hours

            // Fill resources
            for (const resource in this.#resources) {
                if (resource.restored_on == "short rest") {
                    this.set_resource_value(resource, resource.max)
                }
            }
        }

        long_rest() {
            // Fill Health
            this.health = this.max_health

            // Reduce exhaustion (not implemented yet)

            // Fill resources
            for (const resource in this.#resources) {
                const restores_on_rest = ["long rest", "short rest"].includes(resource.restored_on)
                if (restores_on_rest) {
                    this.set_resource_value(resource, resource.max)
                }
            }
        }

        //=====================================================================================================
        // Leveling and Experience
        //=====================================================================================================

        get level() {
            let total = 0
            for (const player_class of this.#classes) {
                total += this.#classes[player_class].level
            }
            return total
        }

        level_up(player_class, choices = {features: []}) {
            const classes = {
                wizard: {
                    name: "Wizard",
                    base_health: 4,
                    spellcasting: "full",
                    subclasses: ["School of Evocation"],
                    resources: {
                        1: [{resource: "Arcane Recovery", max: "2", restored_on: "long rest"}]
                    },
                    choices: {
                        1: [
                            {type: "feature", options: [], amount: 1},
                            {type: "spell", level: 0, class: "wizard", amount: 4}
                        ]
                    },
                    starting_proficiencies: {
                        first_class: [{name: "Mundane Weapon", level: 0}],
                        multi_class: []
                    },
                    description: "A wizard likes studying"
                }
            }

            // Increase level and add starting proficiencies (1st level only)
            if (!this.#classes[player_class]) { 
                this.#classes[player_class] = {level: 1}

                // Starting proficiencies
                const starting_proficiencies = this.level == 1 
                    ? classes[player_class].starting_proficiencies.first_class
                    : classes[player_class].starting_proficiencies.multi_class
                for (const {name, level} of starting_proficiencies) {
                    this.set_proficiency(name, level, true)
                }
            }
            else { 
                this.#classes[player_class].level += 1 
            }
            const class_level = this.#classes[player_class].level

            // Add resources
            const resources_to_add = classes[player_class].resources[class_level] || []
            if (resources_to_add.length > 0) {
                for (const {resource, max, restored_on} of resources_to_add) {
                    if (restored_on) { //--> New resource
                        this.set_new_resource(resource, max, restored_on)
                    } else {
                        this.set_resource_max(resource, max)
                    }
                }
            }

            // Add features
            const database_features = database.get_features_list({subtype: player_class, level: class_level, optional: false})
            const features_to_add = database_features.concat(choices.features)
            for (const feature of features_to_add) {
                this.add_feature(player_class, feature)
            }

        }

        get spellcasting_level() {

            let total = 0
            for (const player_class in this.#classes) {
                const class_level = this.#classes[player_class].level
                const spellcasting = database.get_player_class(player_class).spellcasting

                switch (spellcasting) {
                    case "full":
                        total += class_level
                        break
                    case "half":
                        total += Math.floor(class_level / 2)
                        break
                    case 'third':
                        total += Math.floor(class_level / 3)
                        break
                }

                return total
            }
        }

        update_spell_slots() {
            
        }

        //=====================================================================================================
        // Name
        //=====================================================================================================

        get name() { return this.#name }

        set name(name) {
            this.#name = name

            this.save()

            log(this.#name + " updated their name.")
        }

        
        //=====================================================================================================
        // Type
        //=====================================================================================================
 
        get type() { return this.#type }

        set type(type) {
            this.#type = type

            this.save()

            log(this.#name + " type set to " + type + ".")
        }


        //=====================================================================================================
        // Race
        //=====================================================================================================

        get race() { return this.#race }

        set race(race) {
            // Old race information
            const old_race_data = database.get_race(this.race) || {};
            const old_ability_scores = old_race_data.ability_scores || {};
        
            // Remove old racial features
            for (const feature of this.#features.racial || []) {
                this.remove_feature("racial", feature);
            }
        
            // Remove ability score bonuses
            for (const [score, value] of Object.entries(this.ability_scores)) {
                const bonus = old_ability_scores[score] || 0;
                const total_value = Number(value) - Number(bonus);
                this.set_ability_score(score, total_value);
            }

            //=================================================================================================
        
            // New race information
            const new_race_data = database.get_race(race) || {};
        
            const features = new_race_data.features || [];
            const proficiencies = new_race_data.proficiencies || [];
            const ability_scores = new_race_data.ability_scores || {};
        
            // Add new racial features
            for (const feature of features) {
                this.add_feature("racial", feature);
            }
        
            // Add new proficiencies
            for (const proficiency of proficiencies) {
                this.set_proficiency(proficiency.name, proficiency.level, true);
            }
        
            // Add ability score bonuses
            for (const [score, value] of Object.entries(this.ability_scores)) {
                const bonus = ability_scores[score] || 0;
                const total_value = Number(value) + Number(bonus);
                this.set_ability_score(score, total_value);
            }
        
            // Fill HP
            this.health = this.max_health;
        
            // Change race
            this.#race = race;
        
            // Save state
            this.save();
        
            log(this.#name + " race set to " + race + ".");
        }
        
        


        //=====================================================================================================
        // Ability Scores
        //=====================================================================================================

        get ability_scores() { return this.#ability_scores }

        get score_bonus() {
            let bonus = function (score_value) {
                return Math.floor((score_value - 10) / 2);
            }

            return {
                strength: bonus(this.ability_scores.strength),
                dexterity: bonus(this.ability_scores.dexterity),
                constitution: bonus(this.ability_scores.constitution),
                wisdom: bonus(this.ability_scores.wisdom),
                intelligence: bonus(this.ability_scores.intelligence),
                charisma: bonus(this.ability_scores.charisma)
            }
        }

        set_ability_score(ability_score, value) {

            // Validating parameters
            if (isNaN(Number(value))) {return}
            if (!this.ability_scores[ability_score]) {return}

            value = Number(value)
            const min_score_value = 0, max_score_value = 30
            const clamped_value = Math.min(Math.max(value, min_score_value), max_score_value)

            this.#ability_scores[ability_score] = clamped_value

            this.save()

            log(this.#name + " " + ability_score + " set to " + clamped_value + ".")
        }


        //=====================================================================================================
        // Health
        //=====================================================================================================

        get health() { return this.#health }
        
        get max_health() {
            let calculated_max_health = this.#ability_scores.constitution

            // Level based health increase
            for (const player_class of this.classes) {
                const class_base_health = database.player_classes.data[player_class].base_health || 6
                const class_level = this.classes[player_class].level
                calculated_max_health += class_base_health * class_level
            }

            // Feature-based modifiers
            const feature_modifiers = {
                "Dwarven Toughness": { type: "add", value: 1 * level }
            };
            for (const [feature, modifier] of Object.entries(feature_modifiers)) {
                if (this.has_feature(feature)) {
                    if (modifier.type === "add") { calculated_max_health += modifier.value; } 
                    else if (modifier.type === "multiply") { calculated_max_health *= modifier.value; }
                }
            }

            return calculated_max_health
        }

        set health(health) {

            // Validating parameters
            if (isNaN(Number(health))) { return }
            const clampedHealth = Math.max(Math.min(health, this.max_health), 0)

            this.#health = clampedHealth;
            
            this.save();
        }

        receive_damage(value, type) {

            // Validating parameters
            if (value <= 0) {return}
            if (typeof type != "string") {return}

            const resistance = this.resistances[type];
            let damage = 0;

            // Calculate damage based on resistance
            switch (resistance.type) {
                case "immunity":
                    damage = 0;
                    break;
                case "vulnerability":
                    damage = value * 2;
                    break;
                case "heals":
                    this.receive_healing(value)
                    return
                default:
                    damage = Math.max(value - resistance.reduction, 0);
                    break;
            }

            this.health -= damage;

            log(this.#name + " received " + damage + " " + type + " damage.");
        }

        receive_healing(value) {
            this.health += value

            log(this.#name + " received " + value + " points of healing.");
        }


        //=====================================================================================================
        // Resistances
        //=====================================================================================================

        get resistances() {
            
            // Features that add/change resistances
            const feature_modifiers = {
                "Dwarven Resilience": [{ damage: "Poison", reduction: 10 }]
            };

            // Conditions that add/change resistances
            const condition_modifiers = {
                "Rage": [
                    { damage: "Slashing", reduction: 5 },
                    { damage: "Bludgeoning", reduction: 5 },
                    { damage: "Piercing", reduction: 5 }
                ]
            };

            // Default resistance values
            let resistances = {
                "Normal": {type:"default", reduction:0},
                "Nonsilver": {type:"default", reduction:0},
                "Slashing": {type:"default", reduction:0},
                "Piercing": {type:"default", reduction:0},
                "Bludgeoning": {type:"default", reduction:0},
                "Fire": {type:"default", reduction:0},
                "Cold": {type:"default", reduction:0},
                "Lightning": {type:"default", reduction:0},
                "Thunder": {type:"default", reduction:0},
                "Acid": {type:"default", reduction:0},
                "Poison": {type:"default", reduction:0},
                "Psychic": {type:"default", reduction:0},
                "Radiant": {type:"default", reduction:0},
                "Necrotic": {type:"default", reduction:0},
                "Force": {type:"default", reduction:0},
            };

            // Type Priority
            const type_priority = {
                heals: 4,
                immunity: 3,
                weakness: 2,
                default: 1
            }

            // Apply Feature Modifiers
            for (const [feature, modifiers] of Object.entries(feature_modifiers)) {
                if (this.has_feature(feature)) {
                    modifiers.forEach(modifier => {
                        const damage = modifier.damage
                        const new_reduction = modifier.reduction || 0
                        const new_type = modifier.type || "default"
                
                        if (type_priority[new_type] > type_priority[resistances[damage].type]) {
                            resistances[damage].type = new_type;
                        }
                        if (new_reduction > resistances[damage].reduction) {
                            resistances[damage].reduction = new_reduction;
                        }
                    });
                }
            }
        
            // Apply Condition Modifiers
            for (const [condition, modifiers] of Object.entries(condition_modifiers)) {
                if (this.has_condition(condition)) {
                    modifiers.forEach(modifier => {
                        const damage = modifier.damage
                        const new_reduction = modifier.reduction || 0
                        const new_type = modifier.type || "default"
                
                        if (type_priority[new_type] > type_priority[resistances[damage].type]) {
                            resistances[damage].type = new_type;
                        }
                        if (new_reduction > resistances[damage].reduction) {
                            resistances[damage].reduction = new_reduction;
                        }
                    });
                }
            }
            
            return resistances;
        }

        //=====================================================================================================
        // Armor Class
        //=====================================================================================================

        get armor_class() {
            const body_slot = this.equipment.body;
            let armor_type = "None";
            let armor_class;
        
            // Updating armor_type based on currently equipped armor
            if (body_slot) {
                const item = database.get_item(body_slot.name);
                if (item) {
                    // Match armor weight by its properties
                    const type = ["Heavy", "Medium", "Light"].find(prop => 
                        item.properties?.includes(prop)
                    );
                    armor_type = type || armor_type;
                }
            }
        
            // Base armor class values for calc
            const dexterity_modifier = Number(this.score_bonus.dexterity) || 0;
            const item_armor_class = body_slot ? Number(database.get_item(body_slot.name).base_armor_class) || 0 : 0;
        
            // Calculate armor class based on armor type
            switch (armor_type) {
                case "Heavy":
                    armor_class = item_armor_class;
                    break;
                case "Medium":
                    const clamped_dex_bonus = Math.max(-2, Math.min(dexterity_modifier, 2));
                    armor_class = item_armor_class + clamped_dex_bonus;
                    break;
                case "Light":
                    armor_class = item_armor_class + dexterity_modifier;
                    break;
                case "None":
                    armor_class = 10 + dexterity_modifier;
                    break;
                default:
                    armor_class = 10 + dexterity_modifier; // Default to unarmored behavior
                    break;
            }

            // Calculate armor class bonus
            const equipment = this.#equipment
            let equipment_bonus = 0
            for (const slot in equipment) {
                if (equipment[slot] && !slot.includes("secondary")) {
                    const bonus_ac = database.get_item(equipment[slot].name).bonus_armor_class || 0
                    equipment_bonus += Number(bonus_ac)
                }
            }
        
            return armor_class + equipment_bonus;
        }


        //=====================================================================================================
        // Speed
        //=====================================================================================================

        get speed() {
            let baseSpeed = this.#speed.walk;
        
            // Feature-based modifiers
            const feature_modifiers = {
                "Barbaric Movement": { type: "add", value: 10 },
                "Monk Movement": { type: "add", value: 10 },
                "Roving":  { type:"add", value: 5 },
                "Fleet of Foot":  { type:"add", value: 5 },
                "Bulky":  { type:"add", value: -5 },
            };
            for (const [feature, modifier] of Object.entries(feature_modifiers)) {
                if (this.has_feature(feature)) {
                    if (modifier.type === "add") { baseSpeed += modifier.value; } 
                    else if (modifier.type === "multiply") { baseSpeed *= modifier.value; }
                }
            }

            // Condition-based modifiers
            const cnodition_modifiers = {
                "Haste": { type: "multiply", value: 2 },
                "Slow": { type: "multiply", value: 0.5 },
            };
            for (const [condition, modifier] of Object.entries(cnodition_modifiers)) {
                if (this.has_condition(condition)) {
                    if (modifier.type === "add") { baseSpeed += modifier.value; } 
                    else if (modifier.type === "multiply") { baseSpeed *= modifier.value; }
                }
            }
        
            return Math.floor(baseSpeed);
        }
        

        //=====================================================================================================
        // Resources
        //=====================================================================================================

        get resources() {return this.#resources}

        set_new_resource(resource, max, restored_on) {
            this.#resources[resource] = {
                value: 0,
                max: max, 
                restored_on: restored_on,
            }
        }

        set_resource_max(resource, max) {
            this.#resources[resource].max = max
        }

        set_resource_value(resource, value) {
            // Clamp value
            const resource = this.#resources[resource]
            const clamped_value = Math.min(resource.max, Math.max(0, value))

            // Set
            this.#resources[resource].value = clamped_value
        }

        //=====================================================================================================
        // Features
        //=====================================================================================================

        get features() {return this.#features}

        add_feature(type, name) {

            const valid_feature_types = [
                "racial", "feat",
                "barbarian", "bard", "cleric", "druid", "fighter", "monk",
                "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"
            ]

            if (!valid_feature_types.includes(type)) {
                log(this.#name + " attempted to receive the feature " + name + ", but failed due to invalid type '" + type + "'.");
                return;
            }
            if (this.#features[type].includes(name)) {
                log(this.#name + " attempted to receive the " + type + " feature " + name + ", but failed because they already have it.");
                return;
            }

            this.#features.all.push(name);
            this.#features[type].push(name);

            this.save();
            log(this.#name + " received the " + type + " feature " + name + ".");
        }

        remove_feature(type, name) {

            const valid_feature_types = [
                "racial", "feat",
                "barbarian", "bard", "cleric", "druid", "fighter", "monk",
                "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"
            ]

            if (!valid_feature_types.includes(type)) { return; }

            // Removes only one instance from ALL in case gained from multiple classes  
            const index = this.#features.all.indexOf(name); if (index !== -1) { this.#features.all.splice(index, 1);}
            
            this.#features[type] = this.#features[type].filter(value => value != name);

            this.save();
            log(this.#name + " lost the " + type + " feature " + name + ".");
        }

        has_feature(name) {
            return this.#features.all.includes(name);
        }


        //=====================================================================================================
        // Proficiencies
        //=====================================================================================================

        get proficiencies () {return this.#proficiencies}

        set_proficiency(name, level, highest=false) {
            if (isNaN(Number(level))) {
                log("Invalid number when setting proficiency: "+name+" as level: "+level)
                return 
            }

            if(highest && this.proficiencies[name]) {
                this.proficiencies[name] = Math.max(this.get_proficiency_level(name), level)
            }

            this.proficiencies[name] = level
            log(this.#name + " received the proficiency " + name + ".");
            
            this.save()
        }

        remove_proficiency(name) {
            if (this.proficiencies[name]) {
                delete this.proficiencies[name]
            }

            this.save()
        }

        get_proficiency_level(name) {
            if (this.proficiencies[name]) {
                return this.proficiencies[name]
            }
            return -1
        }

        
        //=====================================================================================================
        // Skills
        //=====================================================================================================

        get skills() {
            let skills = {
                // Strength-based skills
                "Athletics": this.score_bonus.strength,
                "Intimidation": Math.max(this.score_bonus.charisma, this.score_bonus.strength),
            
                // Dexterity-based skills
                "Acrobatics": this.score_bonus.dexterity,
                "Sleight of Hand": this.score_bonus.dexterity,
                "Stealth": this.score_bonus.dexterity,
            
                // Wisdom-based skills
                "Animal Handling": this.score_bonus.wisdom,
                "Insight": this.score_bonus.wisdom,
                "Medicine": this.score_bonus.wisdom,
                "Perception": this.score_bonus.wisdom,
                "Survival": this.score_bonus.wisdom,
            
                // Intelligence-based skills
                "Arcana": this.score_bonus.intelligence,
                "History": this.score_bonus.intelligence,
                "Investigation": this.score_bonus.intelligence,
                "Nature": this.score_bonus.intelligence,
                "Religion": this.score_bonus.intelligence,
            
                // Charisma-based skills
                "Deception": this.score_bonus.charisma,
                "Performance": this.score_bonus.charisma,
                "Persuasion": this.score_bonus.charisma
            };

            // Apply Proficiency Bonus
            for (const skill in skills) {
                skills[skill] += (this.get_proficiency_level(skill) + 1) * 2
            }
            
            return skills
        }


        //=====================================================================================================
        // Conditions
        //=====================================================================================================

        get conditions() {
            return this.#conditions
        }

        set_condition(condition, value) {
            value = Number(value)

            if (value >= 1) {
                this.#conditions[condition] = value;
                log(this.#name + " received " + condition + " for " + value + " rounds.");
            } else if (value == 0) {
                delete this.#conditions[condition]
                log(this.#name + " lost the condition " + condition + ".");
            }
            this.save()
        }

        has_condition(name) {
            return name in this.#conditions
        }


        //=====================================================================================================
        // Inventory & Equipment
        //=====================================================================================================

        get inventory () {
            this.update_inventory_slots()
            return this.#inventory
        }

        get equipment() {
            return this.#equipment
        }

        update_inventory_slots() {
            const max_inventory_size = 72;
            const current_size = this.#inventory.length;
    
            if (current_size < max_inventory_size) {
                this.#inventory.push(...Array(max_inventory_size - current_size).fill(null));
            } else if (current_size > max_inventory_size) {
                this.#inventory.splice(max_inventory_size, current_size - max_inventory_size);
            }
    
            this.save();
        }

        receive_item(name, amount = 1) {
            this.update_inventory_slots();
    
            const item = database.get_item(name);
            const max_stack = item.stackable ? item.max_stack || 20 : 1;
    
            // First loop: Check existing stacks
            for (let i = 0; i < this.#inventory.length && amount > 0; i++) {
                const slot = this.#inventory[i];
                if (slot && slot.name === name && slot.amount < max_stack) {
                    const available_space = max_stack - slot.amount;
                    const added_amount = Math.min(amount, available_space);
                    slot.amount += added_amount;
                    amount -= added_amount;
                }
            }
    
            // Second loop: Add to the first empty slot
            for (let i = 0; i < this.#inventory.length && amount > 0; i++) {
                if (this.#inventory[i] === null) {
                    const stack_amount = item.stackable ? Math.min(amount, max_stack) : 1;
                    this.#inventory[i] = { name, amount: stack_amount };
                    amount -= stack_amount;
                }
            }
    
            if (amount > 0) {
                log(amount + " items were not added because the inventory is full.");
            }
    
            this.save();
        }
        
        drop_item(index, amount) {
            // Helper functions
            const DEFAULT_ITEM = { name: null, amount: 0 };
            const getSlot = (container, index) => 
                (container === "inventory" ? this.#inventory[index] : this.#equipment[index]) || DEFAULT_ITEM;
            
            const setSlot = (container, index, value) => {
                if (container === "inventory") {
                    this.#inventory[index] = value?.amount > 0 ? value : null;
                } else {
                    this.#equipment[index] = value?.amount > 0 ? value : null;
                }
            };
            const isInventoryIndex = (index) => !isNaN(Number(index));

            // Update inventory
            this.update_inventory_slots();

            // Define slot item
            const container = isInventoryIndex(index) ? "inventory" : "equipment"
            const slot = getSlot(container, index)
            const item = database.get_item(slot.name);

            if (!slot.name) {
                log("No item to drop at the specified index.");
                return;
            }
    
            // Clamp amount to drop
            amount = amount ? Math.min(amount, item.amount) : item.amount;
    
            if (item.stackable) {
                if (amount < slot.amount) {
                    slot.amount -= amount;
                } else {
                    setSlot(container,index,null);
                }
            } else {
                setSlot(container,index,null);
            }
    
            this.save();
        }

        move_item(from_index, to_index, amount) {
            // Helper function inside move_item (since it's not needed elsewhere)
            const isInventoryIndex = (index) => !isNaN(Number(index));
        
            this.update_inventory_slots();
        
            // Constants and configuration
            const DEFAULT_ITEM = { name: null, amount: 0 };
            const DEFAULT_MAX_STACK = 20;
        
            // Determine source and target containers
            const from_container = isInventoryIndex(from_index) ? "inventory" : "equipment";
            const to_container = isInventoryIndex(to_index) ? "inventory" : "equipment";
        
            // Safe access with fallback
            const getSlot = (container, index) => 
                (container === "inventory" ? this.#inventory[index] : this.#equipment[index]) || DEFAULT_ITEM;
            
            const setSlot = (container, index, value) => {
                if (container === "inventory") {
                    this.#inventory[index] = value?.amount > 0 ? value : null;
                } else {
                    this.#equipment[index] = value?.amount > 0 ? value : null;
                }
            };
        
            // Get items with safe access
            const from_slot = getSlot(from_container, from_index);
            const to_slot = getSlot(to_container, to_index);
        
            // Early exit for invalid moves
            if (!from_slot.name) {
                log("No item to move at the source index.");
                return;
            }
        
            // Validate indices are within bounds
            if ((from_container === "inventory" && from_index >= this.#inventory.length) ||
                (to_container === "inventory" && to_index >= this.#inventory.length)) {
                log("Invalid slot index");
                return;
            }
        
            const item_data = database.get_item(from_slot.name);
            amount = amount ? Math.min(amount, from_slot.amount) : from_slot.amount;
            const isSameItemType = from_slot.name === to_slot.name;
            const canStack = isSameItemType && item_data.stackable;

            // Verify target, if target is equipment and item is not valid for slot stop execution
            const isTargetEquipment = !isInventoryIndex(to_index)
            const isItemValidForSlot = isTargetEquipment ? this.is_valid_item_for_slot(item_data.name, to_index) : true
            if(!isItemValidForSlot) {
                log ("Invalid item for the selected slot")
                return
            }

            // Unequip main hand weapon if offhand impedes its use
            if (isTargetEquipment && ["primary off hand", "secondary off hand"].includes(to_index)) {
                const main_hand_index = to_index == "primary off hand" ? "primary main hand" : "secondary main hand"
                const main_hand_slot = this.#equipment[main_hand_index] || DEFAULT_ITEM
                const main_hand_item = database.get_item(main_hand_slot.name)
                
                if (main_hand_item) {

                    const isTwoHanded = main_hand_item.properties.includes("Two-handed")
                    const isLight = main_hand_item.properties.includes("Light")
                    const offhandIsWeapon = item_data.subtype == "weapon"

                    if (isTwoHanded || (!isLight && offhandIsWeapon)) {
                        this.unequip_item(main_hand_index)
                    }
                
                }
            }

            // Unequip offhand weapon if mainhand impedes its use
            if (isTargetEquipment && ["primary main hand", "secondary main hand"].includes(to_index)) {
                const off_hand_index = to_index == "primary main hand" ? "primary off hand" : "secondary off hand"
                const off_hand_slot = this.#equipment[off_hand_index] || DEFAULT_ITEM
                const off_hand_item = database.get_item(off_hand_slot.name)

                if (off_hand_item) {

                    const isTwoHanded = item_data.properties.includes("Two-handed")
                    const isLight = item_data.properties.includes("Light")
                    const offhandIsWeapon = off_hand_item.subtype == "weapon"

                    if (isTwoHanded || (!isLight && offhandIsWeapon)) {
                        this.unequip_item(off_hand_index)
                    }
                
                }
            }

        
            // Case 1: Swap items (different types or non-stackable)
            if ((!isSameItemType || !item_data.stackable) && to_slot.name) {
                // Store original values before swap
                const original_from = {...from_slot};
                const original_to = {...to_slot};
        
                setSlot(from_container, from_index, original_to);
                setSlot(to_container, to_index, original_from);
            }
            // Case 2: Move to empty slot
            else if (!to_slot.name) {
                const transfer_amount = Math.min(amount, from_slot.amount);
                const new_from = {...from_slot, amount: from_slot.amount - transfer_amount};
                
                setSlot(to_container, to_index, {...from_slot, amount: transfer_amount});
                setSlot(from_container, from_index, new_from.amount > 0 ? new_from : null);
            }
            // Case 3: Stack items
            else if (canStack) {
                const max_stack = item_data.max_stack || DEFAULT_MAX_STACK;
                const available_space = max_stack - to_slot.amount;
                const transfer_amount = Math.min(available_space, amount);
        
                const new_to = {...to_slot, amount: to_slot.amount + transfer_amount};
                const new_from = {...from_slot, amount: from_slot.amount - transfer_amount};
        
                setSlot(to_container, to_index, new_to);
                setSlot(from_container, from_index, new_from.amount > 0 ? new_from : null);
            }
        
            this.save();
        }

        unequip_item(index) {
            const slot = this.#equipment[index]

            this.drop_item(index)
            this.receive_item(slot.name, slot.amount)
        }

        send_item(index) {
            if (selected().id == impersonated().id) { return }

            if (!selected().inventory) { return }

            let target_has_empty_slot = false
            for (const slot of selected().inventory) {
                if (slot == null) {target_has_empty_slot = true}
            }

            if (!target_has_empty_slot) { return }
            
            const item = this.inventory[index]

            selected().receive_item(item.name, item.amount)
            this.drop_item(index)
        }

        is_valid_item_for_slot(item_name, slot) {
            const item_data = database.get_item(item_name);
            
            // Early return for invalid items
            if (!item_data?.type) {
                log("Invalid item data for: " + item_name);
                return false;
            }
        
            // Configuration: Single source of truth for slot requirements
            const EQUIPMENT_SLOT_RULES = {
                "head":        { allowed_type: "equipment", allowed_subtypes: ["helmet", "hat"] },
                "body":        { allowed_type: "equipment", allowed_subtypes: ["armor", "clothing"] },
                "hands":       { allowed_type: "equipment", allowed_subtypes: ["gloves"] },
                "belt":        { allowed_type: "equipment", allowed_subtypes: ["belt"] },
                "feet":        { allowed_type: "equipment", allowed_subtypes: ["boots"] },
                "amulet":      { allowed_type: "equipment", allowed_subtypes: ["amulet"] },
                "right ring":  { allowed_type: "equipment", allowed_subtypes: ["ring"] },
                "left ring":   { allowed_type: "equipment", allowed_subtypes: ["ring"] },
                "cape":        { allowed_type: "equipment", allowed_subtypes: ["cape"] },
                "ammunition":  { allowed_type: "ammunition", allowed_subtypes: [] }, // Any subtype
                "primary main hand": { allowed_type: "equipment", allowed_subtypes: ["weapon"] },
                "primary off hand": { allowed_type: "equipment", allowed_subtypes: ["weapon", "shield"] },
                "secondary main hand": { allowed_type: "equipment", allowed_subtypes: ["weapon"] },
                "secondary off hand": { allowed_type: "equipment", allowed_subtypes: ["weapon", "shield"] },
            };
        
            // Validate slot exists in rules
            if (!EQUIPMENT_SLOT_RULES.hasOwnProperty(slot)) {
                log("Invalid equipment slot: " + slot);
                return false;
            }
        
            const { allowed_type, allowed_subtypes } = EQUIPMENT_SLOT_RULES[slot];
            
            // 1. Check primary type match
            if (item_data.type !== allowed_type) return false;
        
            // 2. Check subtype requirements (empty array = any subtype allowed)
            const subtypeValid = allowed_subtypes.length === 0 ? true : allowed_subtypes.includes(item_data.subtype);
            
            // 3. Check light weapon for offhand slot
            const isOffhandSlot = ["primary off hand", "secondary off hand"].includes(slot)
            const isWeapon = item_data.subtype == "weapon"
            const isLight = item_data.properties.includes("Light")
            if (isOffhandSlot && isWeapon && !isLight) {
                return false;
            }
        
            return subtypeValid;
        }
        

        //=====================================================================================================
        // Instance
        //=====================================================================================================

        constructor(id, reset) {
            super(id)
            let has_property_object = String(this.token.getProperty("object")) != "null";

            // Reset if no previous data or if reset flag is true
            if (!has_property_object || reset) {
                this.#name = this.token.getName();
                log(this.#name + " was reset.");
                this.save();
            }
            else {
                try {
                    this.load();
                }
                catch {
                    this.#name = this.token.getName();
                    log(this.#name + " failed to load and was reset.");
                    this.save();
                }
            }
        }

        //=====================================================================================================
        // MapTool sync
        //=====================================================================================================

        load() {
            let object = JSON.parse(this.token.getProperty("object"));

            // Check for undefined values and raise an error
            const keysToCheck = [
                "name", "classes", "experience", "type", "race", "ability_scores", "speed", "health",
                "resources", "features", "spells",
                "conditions", "equipment", "inventory"
            ];

            for (const key of keysToCheck) {
                if (object[key] === undefined) {
                    throw new Error(`Property "${key}" is undefined in the loaded object.`);
                }
            }

            this.#name = object.name;
            this.#classes = object.classes;
            this.#experience = object.experience;
            this.#type = object.type;
            this.#race = object.race;
            this.#ability_scores = object.ability_scores;
            this.#speed = object.speed;
            this.#health = object.health
            this.#resources = object.resources;
            this.#features = object.features;
            this.#proficiencies = object.proficiencies;
            this.#spells = object.spells;
            this.#conditions = object.conditions;
            this.#equipment = object.equipment;
            this.#inventory = object.inventory;

            this.token.setProperty("class", "Creature");
        }

        save() {
            let object = {
                name: this.#name,
                classes: this.#classes,
                experience: this.#experience,
                type: this.#type,
                race: this.#race,
                ability_scores: this.#ability_scores,
                speed: this.#speed,
                health: this.#health,
                resources: this.#resources,
                features: this.#features,
                proficiencies: this.#proficiencies,
                spells: this.#spells,
                conditions: this.#conditions,
                equipment: this.#equipment,
                inventory: this.#inventory
            };
            
            
            this.token.setName(this.#name);
            this.token.setProperty("object", JSON.stringify(object));
            this.token.setProperty("class", "Creature");
        }

        //=====================================================================================================
    }

} catch (e) {
    MapTool.chat.broadcast("" + e + "\n" + e.stack)
}
