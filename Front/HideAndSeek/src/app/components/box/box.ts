import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-box',
  imports: [NgClass],
  templateUrl: './box.html',
  styleUrl: './box.css',
})
export class Box {
  @Input() data!: { value: number, hider: boolean };
  @Input() role: string = 'seeker';
  @Input() isFlipped: boolean = false;
  @Input() isLocked: boolean = false;
  // NEW: The speed multiplier to make animations faster in the simulation!
  @Input() speedMultiplier: number = 1;

  @Output() boxClicked = new EventEmitter<void>();

  revealed: boolean = false;
  state: 'unsmashed' | 'smashing' | 'treasure' | 'bomb' | 'explosion' | 'hidden' = 'unsmashed';
  treasureGifPath = '/assets/treasure-chest.gif';
  bombGifPath = '/assets/bomb-explosion.gif';
  message: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  userClick() {
    if (this.state !== 'unsmashed' || this.isLocked) return;
    this.boxClicked.emit();

    if (this.role === 'seeker') {
      this.animateSmash(this.data.hider);
    }
  }

  animateComputerGuess(foundTreasure: boolean) {
    if (this.state !== 'treasure') {
      this.state = 'unsmashed';
    }
    this.animateSmash(foundTreasure, true);
  }

  showBuryAnimation() {
    this.state = 'treasure';
    this.message = 'Burying treasure...';
    this.cdr.detectChanges();

    // Divide delay by speedMultiplier!
    setTimeout(() => {
      this.state = 'unsmashed';
      this.message = null;
      this.cdr.detectChanges();
    }, 1000 / this.speedMultiplier);
  }

  resetBox() {
    this.state = 'unsmashed';
    this.revealed = false;
    this.message = null;
    this.cdr.detectChanges();
  }

  private animateSmash(isTreasure: boolean, isComputerMove: boolean = false) {
    this.revealed = true;
    this.state = 'smashing';
    this.cdr.detectChanges();

    setTimeout(() => {
      if (isTreasure) {
        this.state = 'treasure';
        this.message = isComputerMove ? 'Oh no! The computer found yer treasure!' : 'ARRR! Found the treasure!';
      } else {
        this.state = 'bomb';
        this.message = isComputerMove ? 'Computer hit a booby trap! Yer treasure is safe.' : 'BOOM! You hit a booby trap!';
      }
      this.cdr.detectChanges();
    }, 600 / this.speedMultiplier); // Speed applied

    if (!isTreasure) {
      setTimeout(() => {
        this.state = 'explosion';
        this.cdr.detectChanges();
      }, 1200 / this.speedMultiplier); // Speed applied

      setTimeout(() => {
        this.state = 'hidden';
        this.message = null;
        this.cdr.detectChanges();
      }, 2200 / this.speedMultiplier); // Speed applied
    } else {
      setTimeout(() => {
        this.message = null;
        this.cdr.detectChanges();
      }, 3000 / this.speedMultiplier); // Speed applied
    }
  }
}
