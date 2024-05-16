import { Injectable, Optional, SkipSelf } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IrongoonComponent } from '../components/irongoon/irongoon.component';
import { IrongoonCategories, IrongoonInputs } from '../models/irongoon.model';

@Injectable({
  providedIn: 'root',
})
export class IrongoonService {
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
                { id: 0, name: 'Irongoon', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 1, name: 'Ultimate', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
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
                { id: 0, name: 'Stat Randomizer', value: 1, inputType: IrongoonInputs.Slider },
                { id: 1, name: 'Fixed Stat Randomizer', value: 1, inputType: IrongoonInputs.Slider },
                { id: 2, name: 'Average Stat Randomizer', value: 1, inputType: IrongoonInputs.Slider },
                {
                  id: 3,
                  name: 'Solo',
                  value: 1,
                  data: { value: 'option1', name: 'Option 1' },
                  dataList: [
                    { value: 'option1', name: 'Option 1' },
                    { value: 'option2', name: 'Option 2' },
                    { value: 'option3', name: 'Option 3' },
                  ],
                  inputType: IrongoonInputs.Dropdown,
                  disabled: true,
                },
                { id: 4, name: 'No Shops', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 5, name: 'Randomizer+', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
                { id: 6, name: 'Chaos', value: 1, inputType: IrongoonInputs.Slider, disabled: true },
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
                  data: { value: 'RANDOMIZE', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE', name: 'Randomize' },
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
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE', name: 'Randomize' },
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
              ],
            },
          ],
        },
        {
          id: 2,
          name: 'Enemies',
          settings: [
            {
              id: 0,
              name: 'Enemies',
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
                { id: 2, name: 'Speed Stat Upper Bound', value: 100, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatMonstersUpperBound' },
                { id: 3, name: 'Speed Stat Lower Bound', value: 30, inputType: IrongoonInputs.Number, disabled: false, descriptor: 'speedStatMonstersLowerBoundedStatPerLevel' },
                {
                  id: 8,
                  name: 'Monster Stat Variance',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_PERCENT_BOUNDS', name: 'Randomize Percent Bounds' },
                  dataList: [
                    { value: 'RANDOMIZE_PERCENT_BOUNDS', name: 'Randomize Percent Bounds' },
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
      columns: [],
    },
    {
      id: 3,
      name: 'Audio',
      columns: [],
    },
    {
      id: 4,
      name: 'Other',
      columns: [],
    },
  ];

  private baseOptionCategories = JSON.parse(JSON.stringify(this.optionCategories));

  private optionNotifier = new Subject<any>();

  constructor(@Optional() @SkipSelf() parentModule?: IrongoonComponent) {
    if (parentModule) {
      throw new Error('IrongoonService is already loaded. Import it in the IrongoonComponent only');
    }
  }

  sendOptionUpdate() {
    this.optionNotifier.next({});
  }

  getOptionUpdate(): Observable<any> {
    return this.optionNotifier.asObservable();
  }

  randomizeOptionCategories() {}

  resetOptionCategories() {
    this.optionCategories = JSON.parse(JSON.stringify(this.baseOptionCategories));
    this.sendOptionUpdate();
  }

  getConfigList() {
    let configList = [];

    this.optionCategories.forEach((category) => {
      if (category.id === 0) return;

      category.columns.forEach((column) => {
        column.settings.forEach((setting) => {
          setting.options.forEach((option) => {
            if (option.disabled) return;
            let result: any;

            switch (option.inputType) {
              case IrongoonInputs.Dropdown:
                result = option.data.value;
                break;
              case IrongoonInputs.Slider:
                result = option.value;
                break;
              case IrongoonInputs.Number:
                result = option.value;
                break;
            }

            configList.push(`${option.descriptor}: ${result}`);
          });
        });
      });
    });

    return configList;
  }
}
