import { Injectable } from '@angular/core';
import { AudioIrongoonComponent } from '../components/irongoon/audio-irongoon/audio-irongoon.component';
import { EntitiesIrongoonComponent } from '../components/irongoon/entities-irongoon/entities-irongoon.component';
import { ItemsIrongoonComponent } from '../components/irongoon/items-irongoon/items-irongoon.component';
import { OtherIrongoonComponent } from '../components/irongoon/other-irongoon/other-irongoon.component';
import { PresetsIrongoonComponent } from '../components/irongoon/presets-irongoon/presets-irongoon.component';
import { IrongoonSettingCategories } from '../models/irongoon.model';

@Injectable({
  providedIn: 'root',
})
export class IrongoonService {
  settingCategories: IrongoonSettingCategories[] = [
    { id: 0, title: 'Presets', component: PresetsIrongoonComponent },
    { id: 1, title: 'Entities', component: EntitiesIrongoonComponent },
    { id: 2, title: 'Items', component: ItemsIrongoonComponent },
    { id: 3, title: 'Audio', component: AudioIrongoonComponent },
    { id: 4, title: 'Other', component: OtherIrongoonComponent },
  ];
}
