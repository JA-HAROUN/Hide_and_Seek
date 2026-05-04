import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { GameData } from '../../services/game-data';

@Component({
  selector: 'app-choose-role',
  imports: [],
  templateUrl: './choose-role.html',
  styleUrl: './choose-role.css',
})
export class ChooseRole {

  role: 'hider' | 'third' | 'seeker' | null = null;

  constructor(private router: Router, private gameData: GameData) {
    this.role = null;
  }

  chooseRole(selectedRole: 'hider' | 'third' | 'seeker') {
    this.role = selectedRole;
    this.gameData.setRole(selectedRole);
    this.router.navigate(['/get-map-size']);
  }

}
