import { Injectable, Optional, SkipSelf } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IrongoonComponent } from '../components/irongoon/irongoon.component';
import { IrongoonCategories, IrongoonConfigOption, IrongoonInputs, IrongoonTooltip } from '../models/irongoon.model';

@Injectable({
  providedIn: 'root',
})
export class IrongoonService {
  public optionTooltips: IrongoonTooltip[] = [
    {
      option: '',
      message: ``,
    },
    {
      option: 'Irongoon',
      message: `Randomizer is configured for the base Irongoon ruleset.
                <br><br>
                Find the rulesets <a href="https://gist.github.com/Ink230/76197fd8251de5e0927d99077e0c1124">on github</a>.`,
    },
    {
      option: 'Ultimate',
      message: `Randomizer is configured for the Ultimate Irongoon ruleset.
                <br><br>
                Find the rulesets <a href="https://gist.github.com/Ink230/76197fd8251de5e0927d99077e0c1124">on github</a>.`,
    },
    {
      option: 'Kaizo',
      message: `Randomizer is configured for the Kaizo Irongoon ruleset.
                <br><br>
                Find the rulesets <a href="https://gist.github.com/Ink230/76197fd8251de5e0927d99077e0c1124">on github</a>.`,
    },
    {
      option: '108th',
      message: `Randomizer is configured for the special 108th Irongoon ruleset.
                <br><br>
                Find the rulesets <a href="https://gist.github.com/Ink230/76197fd8251de5e0927d99077e0c1124">on github</a>.`,
    },
    {
      option: 'Stat Randomizer',
      message: `Randomize character and monster stats with default upper and lower bounds.
                <br><br>
                An upper and lower bound of total stats per level is sourced from all characters.`,
    },
    {
      option: 'Fixed Stat Randomizer',
      message: `Randomize character and monster stats with default upper and lower bounds.
                <br><br>
                Each character uses their own total stats per level count.`,
    },
    {
      option: 'Average Stat Randomizer',
      message: `Randomize character and monster stats with default upper and lower bounds.
                <br><br>
                Each character receives the same average total stats of all characters per level.`,
    },
    {
      option: 'No Shops',
      message: `All shops are disabled. Including services, Arena, and anywhere you exchange gold or items for other items.`,
    },
    {
      option: 'Randomizer+',
      message: `Randomizes a collection of options for a true randomizer experience.`,
    },
    {
      option: 'Chaos',
      message: `Randomizes everything, often re-randomizing on action. 
                <br><br>
                Ex: Randomizes elements on every encounter, randomizes character stats on each load...etc.`,
    },
    {
      option: 'Suggest some!',
      message: `Open a github issue today.`,
    },
    {
      option: 'Body Stats',
      message: `Includes character Attack, Defense, Magical Attack, and Magical Defense.
                <br><br>
                Each level has a specific increase in each specific body stat. Known as 'per level'. All settings calculate a 'total stats per level'.
                <br><br>
                <b>Randomize per level</b>
                <br>
                All characters body stats are summed per level. A minimum and maximum is retrieved from this set. A random value is generated between these bounds. This value is the total stats per level available to the character for the level in question.
                <br><br>
                <b>Randomize stock per level</b>
                <br>
                Use the vanilla total stats per level of the character in question.
                <br><br>
                <b>Randomize average per level</b>
                <br>
                Takes the average of total stat value of all characters per level. Each character then uses this value for the specific level.
                <br><br>
                <b>Stock</b>
                <br>
                The character's stock stats are used per level. There is no distribution.
                <br><br>
                Body Stats Distribution handles how the resulting 'total stat per level' value is distributed among the body stats.`,
    },
    {
      option: 'Body Stats Distribution',
      message: `Takes the total stats per level value calculated from the Body Stats setting and distributes the sum across the included body stats.
               <br><br>
               <b>Random</b>
               <br>
               Randomly distributes the total stats per level across the included body stats. It is possible for one stat to receive all of the total stats per level available.
               <br><br>
               There is no fixed pattern between levels, each level will have a different distribution applied.
               <br><br>
               <b>Fixed</b>
               <br>
               Same as Random. However, there is a fixed distribution per level.
               <br><br>
               If a character receives a 50%/20%/20%/10% distribution at Level 1, it will also have this distribution for all subsequent levels.
               <br><br>
               <b>Shuffle</b>
               <br>
               Same as Fixed. However, the distribution remains the same but the stats are shuffled.
               <br><br>
               If we have our 50%/20%/20%/10% at Level 1, then Level 2 will have the same distribution but in a different order, say 10%/20%/50%/20%.`,
    },
    {
      option: 'Dragoon Stats',
      message: `Includes the dragoon percentage modifiers for each Body Stat.
               <br><br>
               The settings work the same as the Body Stats option but uses these percentage points as stat points.
               <br><br>
               <b>Randomize per level</b>
               <br>
               All dragoon stats are summed per level. A minimum and maximum is retrieved from this set. A random value is generated between these bounds. This value is the total stats per level available to the dragoon for the level in question.
               <br><br>
               <b>Randomize stock per level</b>
               <br>
               Use the vanilla total stats per level of the dragoon in question.
               <br><br>
               <b>Randomize average per level</b>
               <br>
               Takes the average of total stat value of all dragoons per level. Each dragoon then uses this value for the specific level.
               <br><br>
               <b>Stock</b>
               <br>
               The dragoon's stock stats are used per level. There is no distribution.
               <br><br>
               Dragoon Stats Distribution handles how the resulting 'total stat per level' value is distributed among the dragoon stats.`,
    },
    {
      option: 'Dragoon Stats Distribution',
      message: `Takes the total stats per level value calculated from the Dragoon Stats setting and distributes the sum across the included dragoon stats.
               <br><br>
               <b>Random</b>
               <br>
               Randomly distributes the total stats per level across the included dragoon stats. It is possible for one stat to receive all of the total stats per level available.
               <br><br>
               There is no fixed pattern between levels, each level will have a different distribution applied.
               <br><br>
               <b>Fixed</b>
               <br>
               Same as Random. However, there is a fixed distribution per level.
               <br><br>
               If a dragoon receives a 50%/20%/20%/10% distribution at Level 1, it will also have this distribution for all subsequent levels.
               <br><br>
               <b>Shuffle</b>
               <br>
               Same as Fixed. However, the distribution remains the same but the stats are shuffled.
               <br><br>
               If we have our 50%/20%/20%/10% at Level 1, then Level 2 will have the same distribution but in a different order, say 10%/20%/50%/20%.`,
    },
    {
      option: 'Body Total Stats Bounds',
      message: `Not implemented.
               <br><br>
               Will allow you to add an upper and lower bound to the total stats per level value for any of the Body Stats options.`,
    },
    {
      option: 'Dragoon Total Stats Bounds',
      message: `Not implemented.
               <br><br>
               Will allow you to add an upper and lower bound to the total stats per level value for any of the Dragoon Stats options.`,
    },
    {
      option: 'HP Stat Per Level',
      message: `Defines how the HP stat of characters is randomized.
               <br><br>
               <b>Randomize Bounds</b>
               <br>
               Calculates the per level HP amount of all characters. A minimum and maximum is retrieved from this set. A random value between the minimum and maximum is generated as the additive amount of HP for that character's level.
               <br><br/>
               <b>Randomize Stock with Bounds</b>
               <br>
               Calculates the per level HP amount of the character in question. This value is adjusted by the HP Stat Upper and Lower Percent Bounds.
               <br><br>
               A random value between the percent bounds is chosen and is applied to the original HP per level amount.
               <br><br/>
               <b>Randomize Percent Bounds</b>
               <br>
               Same behaviour as Randomize Bounds. However, after the min and max are used to find an HP amount, this resulting value is modified by a percent value bounded by the HP Stat Upper and Lower Percent Bounds.
               <br><br/>
               <b>Stock</b>
               <br>
               HP is kept stock as sourced from the .csv files.
               `,
    },
    {
      option: 'HP Stat Upper Percent Bound',
      message: `Upper limit of what percentage a resulting HP amount can be modified by.
               <br><br>
               150 indicates that the calculated HP stat can be multiplied by 1.5x or have an upper limit of 50% over the calculated HP amount.`,
    },
    {
      option: 'HP Stat Lower Percent Bound',
      message: `Lower limit of what percentage a resulting HP amount can be modified by.
               <br><br>
               50 indicates that the calculated HP stat can be multiplied by 0.5x or have a lower limit of 50% less that of the calculated HP amount.`,
    },
    {
      option: 'Speed Stat Per Level',
      message: `Defines how the Speed stat of characters is randomized.
               <br><br>
               <b>Randomize Bounds</b>
               <br>
               Retrieves all of the Speed stats from all characters. A minimum and maximum is retrieved from this set. A random value between the minimum and maximum is generated as the Speed stat.
               <br><br/>
               <b>Randomize Stock with Bounds</b>
               <br>
               Retrieves the Speed stat of the character. This value is modified by a value randomly selected between the given percentage bounds.
               <br><br>
               A random value between the percent bounds is chosen and is applied to the original Speed value.
               <br><br/>
               <b>Randomize Percent Bounds</b>
               <br>
               Note: Not implemented.
               <br><br>
               Same behaviour as Randomize Bounds. However, after the min and max are used to find a Speed value, this resulting value is modified by a percent value bounded by the Speed Stat Upper and Lower Percent Bounds.
               <br><br/>
               <b>Stock</b>
               <br>
               Speed is kept stock as sourced from the .csv files.
               `,
    },
    {
      option: 'Speed Stat Upper Percent Bound',
      message: `Upper limit of what percentage a resulting speed amount can be modified by.
               <br><br>
               150 indicates that the calculated HP stat can be multiplied by 1.5x or have an upper limit of 50% over the calculated HP amount.
               <br><br>
               Note
               <br>
               In a 3vs3 fight, Character 1 has 30 Speed, and Character 3 has 70 Speed, and all other entities have 50 Speed.
               <br><br>
               Character 1 will have 11% of the turns, and Character 3 will have 25% of turns. 
               <br>
               Others will have 16%.
               <br>
               If the 70 Speed was 90, the turn share would be 32%.`,
    },
    {
      option: 'Speed Stat Lower Percent Bound',
      message: `Lower limit of what percentage a resulting HP amount can be modified by.
               <br><br>
               50 indicates that the calculated HP stat can be multiplied by 0.5x or have a lower limit of 50% less that of the calculated HP amount.
               <br><br>
               Note
               <br>
               In a 3vs3 fight, Character 1 has 30 Speed, and Character 3 has 70 Speed, and all other entities have 50 Speed.
               <br><br>
               Character 1 will have 11% of the turns, and Character 3 will have 25% of turns. 
               <br>
               Others will have 16%.
               <br>
               If the 70 Speed was 90, the turn share would be 32%.`,
    },
    {
      option: 'Elements',
      message: `Only implemented for monsters and Elements-only (no typings).
               <br><br>
               <b>Randomize</b>
               <br>
               Entity elements are randomized.
               <br><br>
               <b>Random Random</b>
               <br>
               Entity elements are randomized on every encounter.
               <br><br>
               <b>Randomize Typings</b>
               <br>
               Entity typings are randomized.
               <br><br>
               <b>Randomize Random Typings</b>
               <br>
               Entity typings are randomized on every encounter.
               <br><br>
               <b>Elements and Typings</b>
               <br>
               Entity elements and type matchups are randomized.
               <br><br>
               <b>Random Random Elements and Typings</b>
               <br>
               Entity elements and type matchups are randomized on every encounter.
               <br><br>
               <b>Stock</b>
               <br>
               Stock elements and stock typings.`,
    },
    {
      option: 'No Element',
      message: `Only implemented for monsters.
               <br><br>
               <b>Exclude</b>
               <br>
               Entity elements and typings will not contain No_Element.
               <br><br>
               <b>Include</b>
               <br>
               Entity elements and typings will contain No_Element.
               <br><br>
               <b>Elements Only</b>
               <br>
               Add No_element to the possible Elements.
               <br><br>
               <b>Immunities Only</b>
               <br>
               Add No_Element to the possible Immunities.`,
    },
    {
      option: 'Dragoon Elements',
      message: `Not implemented.
               <br><br>
               <b>Randomize</b>
               <br>
               Dragoon elements are randomized.
               <br><br>
               <b>Random Random</b>
               <br>
               Dragoon elements are randomized on every encounter.
               <br><br>
               <b>Randomize Typings</b>
               <br>
               Dragoon typings are randomized.
               <br><br>
               <b>Randomize Random Typings</b>
               <br>
               Dragoon typings are randomized on every encounter.
               <br><br>
               <b>Elements and Typings</b>
               <br>
               Dragoon elements and type matchups are randomized.
               <br><br>
               <b>Random Random Elements and Typings</b>
               <br>
               Dragoon elements and type matchups are randomized on every encounter.
               <br><br>
               <b>Use Character Element</b>
               <br>
               Use the current Character element for Dragoon.
               <br><br>
               <b>Stock</b>
               <br>
               Stock elements and stock typings.`,
    },
    {
      option: 'Dragoon Spells',
      message: `Not implemented. Will become a slider for each option.
               <br><br>
               <b>Randomize</b>
               <br>
               Randomizes stats, effects, learn order, and MP cost.
               <br><br>
               <b>Randomize Stats</b>
               <br>
               Randomize only the stats of Dragoon spells.
               <br><br>
               <b>Randomize Effects</b>
               <br>
               Randomize only the effects of Dragoon spells.
               <br><br>
               <b>Randomize Stats and Effects</b>
               <br>
               Randomize both stats and effects of Dragoon spells.
               <br><br>
               <b>Randomize All</b>
               <br>
               Randomizes stats, effects, learn order, and MP cost across all characters.
               <br><br>
               <b>Randomize Random All</b>
               <br>
               Randomizes stats, effects, learn order, and MP cost across all characters on every encounter.
               <br><br>`,
    },
    {
      option: 'Monster Stats',
      message: `Includes monster Attack and Magic Attack, and Defense and Magic Defense as two sets.
                <br><br>
                <b>Randomize Bounds</b>
                <br>
                Attack and Magic Attack are summed.
                <br>
                Defense and Magic Defense are summed.
                <br><br>
                These two values are split by a random ratio. The resulting split of each sum is applied to the monster stats. 
                <br><br>
                <b>Randomize Stock w/ Fixed Bounds</b>
                <br>
                Each individual monster stat is modified by a random percent bounded by a lower and upper bound.
                <br><br>
                <b>Stock</b>
                <br>
                Use the vanilla monster stats.`,
    },
    {
      option: 'Monster Stats Upper Percent Bound',
      message: `Upper limit of what percentage a monsters stat may be modified by.
               <br><br>
               150 indicates that the calculated stat can be multiplied by 1.5x or have an upper limit of 50% over the calculated amount.`,
    },
    {
      option: 'Monster Stats Lower Percent Bound',
      message: `Lower limit of what percentage a monsters stat may be modified by.
               <br><br>
               50 indicates that the calculated stat can be multiplied by 0.5x or have a lower limit of 50% less that of the calculated amount.`,
    },
    {
      option: 'Monster Defense Floor',
      message: `Hard lower limit of what value a monster's Defense value can be.
               <br><br>
               Damage formulas are exponential. The exponential formulas are balanced around HP values.
               <br><br>
               Early game mobs can have 150 Defense, while difficult late game mobs (or bosses) will also have 150 Defense.
               <br>
               The balancing factor is the amount of HP.
               <br><br>
               This is what yields the very harsh few early game fights from Seles to the Cavern.
               <br><br>
               Consult the vanilla .csv files to get a feel for the Defense values and how they are used.`,
    },
    {
      option: 'Monster Magic Defense Floor',
      message: `Hard lower limit of what value a monster's Magic Defense value can be.
               <br><br>
               Damage formulas are exponential. The exponential formulas are balanced around HP values.
               <br><br>
               Early game mobs can have 150 Magic Defense, while difficult late game mobs (or bosses) will also have 150 Magic Defense.
               <br>
               The balancing factor is the amount of HP.
               <br><br>
               This is what yields the very harsh few early game fights from Seles to the Cavern.
               <br><br>
               Consult the vanilla .csv files to get a feel for the Magic Defense values and how they are used.`,
    },
    {
      option: 'HP Stat Monsters',
      message: `How the monster's HP stat is randomized.
               <br><br>
               <b>Randomize Bounds</b>
               <br>
               The stock HP of the monster is randomized by using a randomly selected modifier from a lower and upper percent bound.
               <br><br>
               <b>Stock</b>
               <br>
               Use vanilla .csv monster HP values.`,
    },
    {
      option: 'HP Stat Upper Bound',
      message: `Upper limit of what percentage a resulting HP amount can be modified by.
               <br><br>
               150 indicates that the calculated HP stat can be multiplied by 1.5x or have an upper limit of 50% over the calculated HP amount.`,
    },
    {
      option: 'HP Stat Lower Bound',
      message: `Lower limit of what percentage a resulting HP amount can be modified by.
               <br><br>
               50 indicates that the calculated HP stat can be multiplied by 0.5x or have a lower limit of 50% less that of the calculated HP amount.`,
    },
    {
      option: 'Speed Stat Monsters',
      message: `How the monster's Speed stat is randomized.
               <br><br>
               <b>Randomize Bounds</b>
               <br>
               The stock Speed of the monster is randomized by using a randomly selected value from a lower and upper bound.
               <br><br>
               <b>Randomize Random Bounds</b>
               <br>
               The stock Speed of the monster is randomized by using a randomly selected value from a lower and upper bound on every encounter.
               <br><br>
               <b>Stock</b>
               <br>
               Use vanilla .csv monster Speed values.`,
    },
    {
      option: 'Speed Stat Upper Bound',
      message: `Upper limit of what percentage a resulting Speed amount can be modified by.
               <br><br>
               The vanilla maximum value is 200 but the majority of mobs fall below 80.
               <br><br>
               Note
               <br>
               In a 3vs3 fight, Character 1 has 30 Speed, and Character 3 has 70 Speed, and all other entities have 50 Speed.
               <br><br>
               Character 1 will have 11% of the turns, and Character 3 will have 25% of turns. 
               <br>
               Others will have 16%.
               <br>
               If the 70 Speed was 90, the turn share would be 32%.`,
    },
    {
      option: 'Speed Stat Lower Bound',
      message: `Lower limit of what percentage a resulting Speed amount can be modified by.
               <br><br>
               The vanilla minimum value is 30 for regular mobs.
               <br><br>
               Note
               <br>
               In a 3vs3 fight, Character 1 has 30 Speed, and Character 3 has 70 Speed, and all other entities have 50 Speed.
               <br><br>
               Character 1 will have 11% of the turns, and Character 3 will have 25% of turns. 
               <br>
               Others will have 16%.
               <br>
               If the 70 Speed was 90, the turn share would be 32%.`,
    },
    {
      option: 'Monster Stat Variance',
      message: `Applies a variance filter on monster stats.
                <br>
                • The same monster across different encounters will have slightly different stats
                • Two of the same monster in an encounter will have slightly different stats
               <br><br>
               <b>Randomize Percent Bounds</b>
               <br>
               Variance of 60 to 100 percentage points of the calculated value.
               <br><br>
               If the stat is below 10, we apply a random addition of -3 to +3 to the value instead.`,
    },
    {
      option: 'Use New Seed on Campaign Start',
      message: `While set to TRUE, this option will have the randomizer ignore the publicSeed in the config.yaml.
               <br><br>
               The randomizer will then create and save a campaign-specific seed in the Severed Chains campaign config file.
               <br><br>
               While the option is true, the randomizer will look for and only use a campaign config seed.
               <br><br>
               Further, when starting a new campaign, a seed is auto-generated for you and your new campaign.
               <br><br>
               Note
               <br>
               When this option is FALSE, the publicSeed in config.yaml will take priority over any other seeds.`,
    },
    {
      option: 'Slow Down Audio When in Peril',
      message: `Music will slow down when the party is at risk of defeat.`,
    },
    {
      option: 'Boss Themes',
      message: `Do not remember what this one was for.`,
    },
    {
      option: 'Randomize Music',
      message: `All music tracks are randomized on when they play.`,
    },
    {
      option: 'Randomize Sound Effects',
      message: `All sound effects are randomized on when they play.`,
    },
    {
      option: 'Randomize Voices',
      message: `All voices are randomized on when they play.`,
    },
    {
      option: 'Use Custom Music',
      message: `Custom music will be loaded from the Irongoon subfolder in /mods.
               <br><br>
               Please follow the format for custom music to be detected and loaded.`,
    },
    {
      option: 'Use Custom Effects',
      message: `Custom effects will be loaded from the Irongoon subfolder in /mods.
               <br><br>
               Please follow the format for custom effects to be detected and loaded.`,
    },
    {
      option: 'Use Custom Voices',
      message: `Custom voices will be loaded from the Irongoon subfolder in /mods.
               <br><br>
               Please follow the format for custom voices to be detected and loaded.`,
    },
  ];

  public optionCategories: IrongoonCategories[] = [
    {
      id: 0,
      name: 'Presets',
      columns: [
        {
          id: 0,
          name: 'Irongoon',
          settings: [
            {
              id: 0,
              name: 'Irongoon',
              options: [
                {
                  id: 0,
                  name: 'Irongoon',
                  value: 1,
                  inputType: IrongoonInputs.Slider,
                  disabled: true,
                },
                {
                  id: 1,
                  name: 'Ultimate',
                  value: 1,
                  inputType: IrongoonInputs.Slider,
                  disabled: true,
                },
                { id: 2, name: 'Kaizo', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 3, name: '108th', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
              ],
            },
          ],
        },
        {
          id: 1,
          name: 'Randomizer',
          settings: [
            {
              id: 0,
              name: 'Randomizer',
              options: [
                { id: 0, name: 'Stat Randomizer', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Fixed Stat Randomizer', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'Average Stat Randomizer', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 3, name: 'No Shops', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 4, name: 'Randomizer+', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 5, name: 'Chaos', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'Community',
          settings: [
            {
              id: 0,
              name: 'Community',
              options: [{ id: 0, name: 'Suggest some!', value: 1, inputType: IrongoonInputs.Slider, disabled: true }],
            },
          ],
        },
      ],
    },
    {
      id: 1,
      name: 'Entities',
      columns: [
        {
          id: 0,
          name: 'Characters',
          settings: [
            {
              id: 0,
              name: 'Characters',
              options: [
                {
                  id: 0,
                  name: 'Body Stats',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize per level' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize per level' },
                    { value: 'MAINTAIN_STOCK', name: 'Randomize stock per level' },
                    { value: 'AVERAGE_ALL_CHARACTERS', name: 'Randomize average per level' },
                    { value: 'STOCK', name: 'Stock' },
                  ],
                  descriptor: 'bodyTotalStatsPerLevel',
                },
                {
                  id: 1,
                  name: 'Body Stats Distribution',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOM', name: 'Random' },
                  dataList: [
                    { value: 'RANDOM', name: 'Random' },
                    { value: 'DABAS_FIXED', name: 'Fixed' },
                    { value: 'DABAS_PER_LEVEL', name: 'Shuffle' },
                  ],
                  descriptor: 'bodyTotalStatsDistributionPerLevel',
                },
                {
                  id: 2,
                  name: 'Body Total Stats Bounds',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'STOCK', name: 'Stock' },
                  dataList: [
                    { value: 'STOCK', name: 'Stock' },
                    { value: 'RANDOM_MODIFIER', name: 'Random modifier' },
                    { value: 'RANDOM_MODIFER_CUSTOM_UPPER_BOUND', name: 'Random modifier with custom upper bound' },
                  ],
                  descriptor: 'bodyTotalStatsBounds',
                  disabled: true,
                },
                {
                  id: 3,
                  name: 'HP Stat Per Level',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize Bounds' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize Bounds' },
                    { value: 'RANDOMIZE_STOCK_BOUNDS', name: 'Randomize Stock with Bounds' },
                    { value: 'RANDOMIZE_BOUND_PERCENT_MODIFIED_PER_LEVEL', name: 'Randomize Percent Bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'hpStatPerLevel',
                },
                { id: 4, name: 'HP Stat Upper Percent Bound', value: 150, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'hpStatUpperPercentBound' },
                { id: 5, name: 'HP Stat Lower Percent Bound', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'hpStatLowerPercentBound' },
                {
                  id: 6,
                  name: 'Speed Stat Per Level',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                    { value: 'RANDOMIZE_RANDOM_BOUNDS', name: 'Randomize Stock with Bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'speedStatPerLevel',
                },
                { id: 7, name: 'Speed Stat Upper Percent Bound', value: 150, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatUpperPercentBound' },
                { id: 8, name: 'Speed Stat Lower Percent Bound', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatLowerPercentBound' },
                {
                  id: 9,
                  name: 'Elements',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE', name: 'Randomize' },
                    { value: 'RANDOMIZE_RANDOM', name: 'Random Random' },
                    { value: 'RANDOMIZE_AND_TYPINGS', name: 'Elements and Typings' },
                    { value: 'RANDOMIZE_RANDOM_AND_TYPINGS', name: 'Random Random Elements and Typings' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'characterElements',
                  disabled: true,
                },
                {
                  id: 10,
                  name: 'No Element',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'EXCLUDE', name: 'Exclude' },
                  dataList: [
                    { value: 'EXCLUDE', name: 'Exclude' },
                    { value: 'INCLUDE', name: 'Include' },
                    { value: 'ELEMENTS_ONLY', name: 'Elements Only' },
                    { value: 'IMMUNITIES_ONLY', name: 'Immunities Only' },
                  ],
                  descriptor: 'noElementCharacters',
                  disabled: true,
                },
              ],
            },
          ],
        },
        {
          id: 1,
          name: 'Dragoons',
          settings: [
            {
              id: 0,
              name: 'Dragoons',
              options: [
                {
                  id: 4,
                  name: 'Dragoon Stats',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize per level' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize per level' },
                    { value: 'MAINTAIN_STOCK', name: 'Randomize stock per level' },
                    { value: 'AVERAGE_ALL_CHARACTERS', name: 'Randomize average per level' },
                    { value: 'STOCK', name: 'Stock' },
                  ],
                  descriptor: 'dragoonTotalStatsPerLevel',
                },
                {
                  id: 5,
                  name: 'Dragoon Stats Distribution',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOM', name: 'Random' },
                  dataList: [
                    { value: 'RANDOM', name: 'Random' },
                    { value: 'DABAS_FIXED', name: 'Fixed' },
                    { value: 'DABAS_PER_LEVEL', name: 'Shuffle' },
                  ],
                  descriptor: 'dragoonTotalStatsDistributionPerLevel',
                },
                {
                  id: 6,
                  name: 'Dragoon Total Stats Bounds',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'STOCK', name: 'Stock' },
                  dataList: [
                    { value: 'STOCK', name: 'Stock' },
                    { value: 'RANDOM_MODIFIER', name: 'Random modifier' },
                    { value: 'RANDOM_MODIFER_CUSTOM_UPPER_BOUND', name: 'Random modifier with custom upper bound' },
                  ],
                  descriptor: 'dragoonTotalStatsBounds',
                  disabled: true,
                },
                {
                  id: 7,
                  name: 'Dragoon Elements',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE', name: 'Randomize' },
                    { value: 'RANDOMIZE_RANDOM', name: 'Random Random' },
                    { value: 'RANDOMIZE_AND_TYPINGS', name: 'Elements and Typings' },
                    { value: 'RANDOMIZE_RANDOM_AND_TYPINGS', name: 'Random Random Elements and Typings' },
                    { value: 'MAINTAIN_CHARACTER_ELEMENT', name: 'Use Character Element' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'dragoonElements',
                  disabled: true,
                },
                {
                  id: 8,
                  name: 'No Element',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'EXCLUDE', name: 'Exclude' },
                  dataList: [
                    { value: 'EXCLUDE', name: 'Exclude' },
                    { value: 'INCLUDE', name: 'Include' },
                    { value: 'ELEMENTS_ONLY', name: 'Elements Only' },
                    { value: 'IMMUNITIES_ONLY', name: 'Immunities Only' },
                    { value: 'MAINTAIN_CHARACTER_ELEMENT_IMMUNITIES', name: 'Use Character Element Immunities' },
                  ],
                  descriptor: 'noElementDragoons',
                  disabled: true,
                },
                {
                  id: 8,
                  name: 'Dragoon Spells',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: '', name: 'Randomize' },
                  dataList: [
                    { value: '', name: 'Randomize' },
                    { value: '', name: 'Randomize Stats' },
                    { value: '', name: 'Randomize Effects' },
                    { value: '', name: 'Randomize Stats and Effects' },
                    { value: '', name: 'Randomize All' },
                    { value: '', name: 'Randomize Random All' },
                  ],
                  descriptor: 'dragoonSpells',
                  disabled: true,
                },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'Monsters',
          settings: [
            {
              id: 0,
              name: 'Monsters',
              options: [
                {
                  id: 0,
                  name: 'Monster Stats',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                    { value: 'RANDOMIZE_STOCK_BOUNDS', name: 'Randomize Stock w/ Fixed Bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'monsterTotalStatsPerLevel',
                },
                { id: 0, name: 'Monster Stats Upper Percent Bound', value: 150, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'totalStatsMonstersUpperPercentBound' },
                { id: 1, name: 'Monster Stats Lower Percent Bound', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'totalStatsMonstersLowerPercentBound' },
                { id: 2, name: 'Monster Defense Floor', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'monsterDefenseFloor' },
                { id: 3, name: 'Monster Magic Defense Floor', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'monsterMagicDefenseFloor' },
                {
                  id: 4,
                  name: 'HP Stat Monsters',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'hpStatMonsters',
                },
                { id: 5, name: 'HP Stat Upper Bound', value: 150, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'hpStatMonstersUpperPercentBound' },
                { id: 6, name: 'HP Stat Lower Bound', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'hpStatMonstersLowerPercentBound' },
                {
                  id: 7,
                  name: 'Speed Stat Monsters',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                    { value: 'RANDOMIZE_RANDOM_BOUNDS', name: 'Randomize Random Bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'speedStatMonsters',
                },
                { id: 2, name: 'Speed Stat Upper Bound', value: 80, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatMonstersUpperBound' },
                { id: 3, name: 'Speed Stat Lower Bound', value: 30, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatMonstersLowerBound' },
                {
                  id: 8,
                  name: 'Monster Stat Variance',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOM_PERCENT_BOUNDS', name: 'Randomize Percent Bounds' },
                  dataList: [
                    { value: 'RANDOM_PERCENT_BOUNDS', name: 'Randomize Percent Bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'statsVarianceMonsters',
                },
                {
                  id: 9,
                  name: 'Elements',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE', name: 'Randomize' },
                    { value: 'RANDOMIZE_RANDOM', name: 'Random Random' },
                    { value: 'RANDOMIZE_AND_TYPINGS', name: 'Elements and Typings' },
                    { value: 'RANDOMIZE_RANDOM_AND_TYPINGS', name: 'Random Random Elements and Typings' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'monsterElements',
                },
                {
                  id: 10,
                  name: 'No Element',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'EXCLUDE', name: 'Exclude' },
                  dataList: [
                    { value: 'EXCLUDE', name: 'Exclude' },
                    { value: 'INCLUDE', name: 'Include' },
                    { value: 'ELEMENTS_ONLY', name: 'Elements Only' },
                    { value: 'IMMUNITIES_ONLY', name: 'Immunities Only' },
                  ],
                  descriptor: 'noElementMonsters',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Items',
      columns: [
        {
          id: 0,
          name: 'Shops',
          settings: [
            {
              id: 0,
              name: 'Shops',
              options: [
                { id: 0, name: 'Disable  All Shops', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Disable Item Shops', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'Disable Equipment Shops', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 3, name: 'Disable Service Shops', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 4, name: 'Inflation Modifier', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                {
                  id: 5,
                  name: 'Randomize Shops',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 's', name: 'Randomize' },
                  dataList: [{ value: 'd', name: 'Stock' }],
                  descriptor: '',
                  disabled: true,
                },
              ],
            },
          ],
        },
        {
          id: 0,
          name: 'Chests',
          settings: [
            {
              id: 0,
              name: 'Chests',
              options: [
                { id: 0, name: 'Randomize Loot', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'No Psyche Bomb', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'No Repeat Items', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 3, name: 'Include Equipment', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 4, name: 'Unique Equipment', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 5, name: 'Equipment %', value: 25, inputType: IrongoonInputs.Number, disabled: true },
                { id: 6, name: 'Attack Item %', value: 25, inputType: IrongoonInputs.Number, disabled: true },
                { id: 7, name: 'Effect Item %', value: 25, inputType: IrongoonInputs.Number, disabled: true },
                { id: 8, name: 'Heal Item %', value: 25, inputType: IrongoonInputs.Number, disabled: true },
              ],
            },
          ],
        },
        {
          id: 0,
          name: 'Drops',
          settings: [
            {
              id: 0,
              name: 'Drops',
              options: [
                { id: 0, name: 'Gold Multiplier', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 1, name: 'Experience Multiplier', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 2, name: 'SP Multiplier', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                {
                  id: 3,
                  name: 'Drops',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 's', name: 'Randomize' },
                  dataList: [
                    { value: 's', name: 'Randomize' },
                    { value: 'd', name: 'Stock' },
                  ],
                  descriptor: '',
                  disabled: true,
                },
                { id: 4, name: 'Include Equipment', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 5, name: 'Include Attack Items', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 6, name: 'Include Effect Items', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 7, name: 'Include Heal Items', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
              ],
            },
            {
              id: 0,
              name: 'Enemies',
              options: [
                { id: 8, name: 'Mob Drop Count', value: 5, inputType: IrongoonInputs.Number, disabled: true },
                { id: 9, name: 'Mob Drop Upper Percent Bound', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 10, name: 'Mob Drop Lower Percent Bound', value: 1, inputType: IrongoonInputs.Number, disabled: true },
                { id: 11, name: 'Guaranteed Mob Drop Count', value: 1, inputType: IrongoonInputs.Number, disabled: true },
                { id: 12, name: 'Mini-Boss Drop Count', value: 5, inputType: IrongoonInputs.Number, disabled: true },
                { id: 13, name: 'Mini-Boss Upper Percent Bound', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 14, name: 'Mini-Boss Lower Percent Bound', value: 1, inputType: IrongoonInputs.Number, disabled: true },
                { id: 15, name: 'Mini-Boss Mob Drop Count', value: 1, inputType: IrongoonInputs.Number, disabled: true },
                { id: 16, name: 'Boss Drop Count', value: 5, inputType: IrongoonInputs.Number, disabled: true },
                { id: 17, name: 'Boss Upper Percent Bound', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 18, name: 'Boss Lower Percent Bound', value: 1, inputType: IrongoonInputs.Number, disabled: true },
                { id: 19, name: 'Boss Mob Drop Count', value: 1, inputType: IrongoonInputs.Number, disabled: true },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Audio',
      columns: [
        {
          id: 0,
          name: 'Sound',
          settings: [
            {
              id: 0,
              name: 'Sound',
              options: [
                { id: 0, name: 'Randomize Music', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Randomize Sound Effects', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'Randomize Voices', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
              ],
            },
          ],
        },
        {
          id: 1,
          name: 'Options',
          settings: [
            {
              id: 0,
              name: 'Options',
              options: [
                { id: 0, name: 'Slow Down Audio When in Peril', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Boss Themes', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'Custom',
          settings: [
            {
              id: 0,
              name: 'Custom',
              options: [
                { id: 0, name: 'Use Custom Music', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Use Custom Effects', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'Use Custom Voices', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 4,
      name: 'Gameplay',
      columns: [
        {
          id: 0,
          name: 'Scaling',
          settings: [
            {
              id: 0,
              name: 'Scaling',
              options: [
                { id: 0, name: 'Element Overload', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Guard Limit', value: 0, inputType: IrongoonInputs.Number, disabled: true },
                { id: 2, name: 'Mob Stats', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 3, name: 'Mobs HP', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 4, name: 'Mini-Boss Stats', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 5, name: 'Mini-Bosses HP', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 6, name: 'Bosse Stats', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 7, name: 'Bosses HP', value: 100, inputType: IrongoonInputs.Number, disabled: true },
                { id: 8, name: 'Mob Magic Attacks', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 9, name: 'Number of Mob M. Attacks', value: 0, inputType: IrongoonInputs.Number, disabled: true },
                { id: 10, name: 'Mini-Boss Magic Attacks', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 11, name: 'Number of Mini-Boss M. Attacks', value: 0, inputType: IrongoonInputs.Number, disabled: true },
                { id: 12, name: 'Boss Magic Attacks', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 13, name: 'Number of Boss M. Attacks', value: 0, inputType: IrongoonInputs.Number, disabled: true },
              ],
            },
          ],
        },
        {
          id: 1,
          name: 'Attack',
          settings: [
            {
              id: 0,
              name: 'Additions',
              options: [
                { id: 0, name: 'Randomize Learn Levels', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Randomize Learn Order', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'Randomize Across Characters (basic)', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 3, name: 'Randomize Across Characters (advanced)', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 5, name: 'Tazmans Trial', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 6, name: 'Addition Master', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 7, name: 'Minimum Number of Additions', value: 0, inputType: IrongoonInputs.Number, disabled: true },
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'Gameplay',
          settings: [
            {
              id: 0,
              name: 'Randomizer',
              options: [{ id: 0, name: 'Use New Seed on Campaign Start', value: 1, inputType: IrongoonInputs.Slider, descriptor: 'useRandomSeedOnNewCampaign', disabled: false }],
            },
            {
              id: 1,
              name: 'Party',
              options: [
                {
                  id: 0,
                  name: 'Starting Character',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 's', name: 'Dart' },
                  dataList: [
                    { value: 's', name: 'Dart' },
                    { value: 'a', name: 'Lavitz' },
                    { value: 'b', name: 'Shana' },
                    { value: 'c', name: 'Rose' },
                    { value: 'd', name: 'Haschel' },
                    { value: 'e', name: 'Albert' },
                    { value: 'f', name: 'Meru' },
                    { value: 'g', name: 'Kongol' },
                    { value: 'h', name: 'Miranda' },
                  ],
                  descriptor: 'noElementMonsters',
                  disabled: true,
                },
                { id: 1, name: 'Random Starting Character', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 2, name: 'Lock Party', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 3, name: 'Party Size', value: 3, inputType: IrongoonInputs.Number, disabled: true },
              ],
            },
            {
              id: 2,
              name: 'Encounters',
              options: [{ id: 0, name: 'Run Slow', value: 1, inputType: IrongoonInputs.Slider, disabled: true }],
            },
          ],
        },
      ],
    },
  ];

  private publicSeed = 'AF51FA7B';
  public numberInputUpperBound = 250;
  public numberInputLowerBound = 30;

  private baseOptionCategories = JSON.parse(JSON.stringify(this.optionCategories));

  private optionNotifier = new Subject<any>();

  constructor(@Optional() @SkipSelf() parentModule?: IrongoonComponent) {
    if (parentModule) {
      throw new Error('IrongoonService is already loaded. Import it in the IrongoonComponent only');
    }

    this.initializeTooltips();
  }

  initializeTooltips() {
    this.optionCategories.forEach((category) => {
      category.columns.forEach((column) => {
        column.settings.forEach((setting) => {
          setting.options.forEach((option) => {
            const tooltip = this.optionTooltips.find((tooltip) => tooltip.option === option.name);
            if (tooltip) {
              option.tooltip = tooltip.message;
            }
          });
        });
      });
    });
  }

  sendOptionUpdate() {
    this.optionNotifier.next({});
  }

  getOptionUpdate(): Observable<any> {
    return this.optionNotifier.asObservable();
  }

  generatePublicSeed() {
    let randomInt = Math.floor(Math.random() * Math.pow(2, 32));

    let hexString = randomInt.toString(16).toUpperCase();

    while (hexString.length < 8) {
      hexString = '0' + hexString;
    }

    this.publicSeed = hexString;
    this.sendOptionUpdate();
  }

  randomizeOptionCategories() {
    this.optionCategories.forEach((category) => {
      if (category.id === 0) return;

      category.columns.forEach((column) => {
        column.settings.forEach((setting) => {
          setting.options.forEach((option, index) => {
            if (option.disabled) return;

            switch (option.inputType) {
              case IrongoonInputs.Dropdown:
                const length = option.dataList.length;
                const choiceDropdown = this.getRandomInt(0, length - 1);
                option.data = option.dataList[choiceDropdown];
                break;
              case IrongoonInputs.Slider:
                const choiceSlider = this.getRandomInt(1, 2);
                option.value = choiceSlider;
                break;
              case IrongoonInputs.Number:
                if (option?.descriptor.includes('Defense')) break;

                const upper = option?.descriptor.includes('Lower') ? setting.options[index - 1].value - 1 : this.numberInputUpperBound;
                const lower = this.numberInputLowerBound;
                const choiceNumber = this.getRandomInt(lower, upper);
                option.value = choiceNumber;
                break;
            }
          });
        });
      });
    });

    this.sendOptionUpdate();
  }

  resetOptionCategories() {
    this.optionCategories = JSON.parse(JSON.stringify(this.baseOptionCategories));
    this.numberInputUpperBound = 250;
    this.numberInputLowerBound = 30;
    this.sendOptionUpdate();
  }

  getConfigList() {
    let configList: IrongoonConfigOption[] = [];

    configList.push({ name: `# Seed`, value: `` });
    configList.push({ name: `publicSeed:`, value: this.publicSeed });
    this.optionCategories.forEach((category) => {
      if (category.id === 0) return;

      category.columns.forEach((column) => {
        column.settings.forEach((setting) => {
          configList.push({ name: `# ${setting.name} `, value: `` });
          setting.options.forEach((option) => {
            if (option.disabled) return;
            let result: any;

            switch (option.inputType) {
              case IrongoonInputs.Dropdown:
                result = option.data.value;
                break;
              case IrongoonInputs.Slider:
                result = option.value == 1 ? 'FALSE' : 'TRUE';
                break;
              case IrongoonInputs.Number:
                result = option.value;
                break;
            }

            configList.push({ name: `${option.descriptor}:`, value: `${result}` });
          });
        });
      });
    });

    return configList;
  }

  private getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
