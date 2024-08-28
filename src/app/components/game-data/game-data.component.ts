import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-game-data',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './game-data.component.html',
  styleUrl: './game-data.component.css',
})
export class GameDataComponent {}
