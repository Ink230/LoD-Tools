import { Injectable } from '@angular/core';
import { IrongoonCategories, IrongoonInputs } from '../models/irongoon.model';

@Injectable({
  providedIn: 'root',
})
export class IrongoonService {
  optionCategories: IrongoonCategories[] = [
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
              options: [{ id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider }],
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
              options: [{ id: 0, name: 'test', value: 1, inputType: IrongoonInputs.Slider }],
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
}
