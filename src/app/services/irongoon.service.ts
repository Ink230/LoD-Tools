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
                    { value: 'MAINTAIN_STOCK', name: 'Randomize stock stats per level' },
                    { value: 'AVERAGE_ALL_CHARACTERS', name: 'Randomize average stats per level' },
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
                    { value: 'RANDOMIZE_RANDOM_BOUNDS', name: 'Randomize Random' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'speedStatPerLevel',
                },
                { id: 7, name: 'Speed Stat Upper Percent Bound', value: 150, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatUpperPercentBound' },
                { id: 8, name: 'Speed Stat Lower Percent Bound', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatLowerPercentBound' },
                {
                  id: 9,
                  name: 'Character Elements',
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
                    { value: 'MAINTAIN_STOCK', name: 'Randomize stock stats per level' },
                    { value: 'AVERAGE_ALL_CHARACTERS', name: 'Randomize average stats per level' },
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
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize Bounds Per Level' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize Bounds Per Level' },
                    { value: 'RANDOMIZE_BOUNDS', name: 'Randomize Bounds' },
                    { value: 'RANDOMIZE_STOCK_BOUNDS', name: 'Randomize with bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'monsterTotalStatsPerLevel',
                },
                { id: 0, name: 'Total Stats Upper Percent Bound', value: 150, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'totalStatsMonstersUpperPercentBound' },
                { id: 1, name: 'Total Stats Lower Percent Bound', value: 50, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'totalStatsMonstersLowerPercentBound' },
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
                { id: 2, name: 'Speed Stat Upper Bound', value: 70, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatMonstersUpperBound' },
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
                  name: 'Monster Elements',
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
