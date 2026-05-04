import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-box',
  imports: [NgClass],
  templateUrl: './box.html',
  styleUrl: './box.css',
})
export class Box {
  @Input() box: Box | null = null;
  value: number | null = null;
  hider: boolean | null = null;
  revealed: boolean = false;
  state: 'unsmashed' | 'smashing' | 'treasure' | 'bomb' | 'explosion' | 'hidden' = 'unsmashed';
  treasureGifPath = '/assets/treasure-chest.gif';
  bombGifPath = '/assets/bomb-explosion.gif';

  constructor(private cdr?: ChangeDetectorRef) {
    this.value = null;
    this.hider = null;
    this.revealed = false;
  }

  get displayBox(): Box {
    return this.box ?? this;
  }

  // Method to set the value of the box
  setValue(value: number, hider: boolean) {
    this.value = value;
    this.hider = hider;
  }

  // Method to reveal the box with smashing animation
  reveal() {
    if (this.state !== 'unsmashed') return;
    
    this.revealed = true;
    this.state = 'smashing';
    this.cdr?.detectChanges();
    
    // After smashing animation, show treasure or bomb
    setTimeout(() => {
      if (this.hider) {
        this.state = 'treasure';
      } else {
        this.state = 'bomb';
      }
      this.cdr?.detectChanges();
    }, 600); // Match smashing animation duration
    
    // If bomb, start explosion animation
    if (!this.hider) {
      setTimeout(() => {
        this.state = 'explosion';
        this.cdr?.detectChanges();
      }, 1200); // After bomb appears, start explosion
      
      // After explosion, hide everything except number
      setTimeout(() => {
        this.state = 'hidden';
        this.cdr?.detectChanges();
      }, 2200); // Explosion duration + delay
    }
  }
  
}
