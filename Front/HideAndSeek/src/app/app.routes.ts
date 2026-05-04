import { Routes } from '@angular/router';
import { ChooseRole } from "./components/choose-role/choose-role";
import { GamePage } from "./components/game-page/game-page";
import { GetMapSize } from './components/get-map-size/get-map-size';
import { SimplexTableau } from './components/simplex-tableau/simplex-tableau';

export const routes: Routes = [
    { path: '', redirectTo: 'choose-role', pathMatch: 'full' },
    { path: 'choose-role', component: ChooseRole },
    { path: 'get-map-size', component: GetMapSize },
    { path: 'game-page', component: GamePage },
    { path: 'simplex-tableau', component: SimplexTableau },
    { path: '**', redirectTo: 'choose-role' },

];
