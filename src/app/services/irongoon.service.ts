import { Injectable } from '@angular/core';
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
                { id: 5, name: 'Randomizer+', value: 1, inputType: IrongoonInputs.Number, disabled: true },
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
                    { value: 'Stock', name: 'Stock' },
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
                    { value: 'Stock', name: 'Stock' },
                  ],
                  descriptor: 'bodyTotalStatsDistributionPerLevel',
                },
                {
                  id: 2,
                  name: 'Dragoon Stats',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize per level' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize per level' },
                    { value: 'MAINTAIN_STOCK', name: 'Randomize stock stats per level' },
                    { value: 'AVERAGE_ALL_CHARACTERS', name: 'Randomize average stats per level' },
                    { value: 'Stock', name: 'Stock' },
                  ],
                  descriptor: 'dragoonTotalStatsPerLevel',
                },
                {
                  id: 3,
                  name: 'Dragoon Stats Distribution',
                  value: 1,
                  inputType: IrongoonInputs.Dropdown,
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE', name: 'Randomize' },
                    { value: 'DABAS_FIXED', name: 'Fixed' },
                    { value: 'DABAS_PER_LEVEL', name: 'Shuffle' },
                    { value: 'Stock', name: 'Stock' },
                  ],
                  descriptor: 'dragoonTotalStatsDistributionPerLevel',
                },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
              ],
            },
          ],
        },
        {
          id: 1,
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
                  data: { value: 'RANDOMIZE_BOUNDS_PER_LEVEL', name: 'Randomize' },
                  dataList: [
                    { value: 'RANDOMIZE_BOUNDS', name: 'Randomize' },
                    { value: 'RANDOMIZE_STOCK_BOUNDS', name: 'Randomize with bounds' },
                    { value: 'MAINTAIN_STOCK', name: 'Stock' },
                  ],
                  descriptor: 'monsterTotalStatsPerLevel',
                },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
                { id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider },
              ],
            },
          ],
        },
        {
          id: 2,
          name: '???',
          settings: [
            {
              id: 0,
              name: '???',
              options: [{ id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider, disabled: true }],
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

  randomizeOptionCategories() {}

  resetOptionCategories() {
    this.optionCategories = JSON.parse(JSON.stringify(this.baseOptionCategories));
  }
}
