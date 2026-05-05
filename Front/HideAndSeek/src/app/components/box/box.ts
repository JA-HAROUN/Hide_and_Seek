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
  @Input() role: string = 'seeker'; // Receive the current role
  @Output() boxClicked = new EventEmitter<void>();

  revealed: boolean = false;
  state: 'unsmashed' | 'smashing' | 'treasure' | 'bomb' | 'explosion' | 'hidden' = 'unsmashed';
  treasureGifPath = '/assets/treasure-chest.gif';
  bombGifPath = '/assets/bomb-explosion.gif';
  message: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  // 1. Handle what happens when the HUMAN clicks the box
  userClick() {
    if (this.state !== 'unsmashed') return;
    this.boxClicked.emit();

    if (this.role === 'hider') {
      // HIDER MODE: User is burying the treasure
      this.revealed = true;
      this.state = 'treasure';
      this.message = 'Treasure buried! Waiting for computer...';
      this.cdr.detectChanges();
    } else {
      // SEEKER MODE: User is smashing the box
      this.animateSmash(this.data.hider);
    }
  }

  // 2. A new method so the parent can force the computer's guess to animate
  animateComputerGuess(foundTreasure: boolean) {
    if (this.state !== 'treasure') {
      this.state = 'unsmashed'; // Ensure it starts from unsmashed if it was empty
    }
    this.animateSmash(foundTreasure, true);
  }

  // 3. The core animation logic (reused by both human and computer)
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
    }, 600);

    if (!isTreasure) {
      setTimeout(() => {
        this.state = 'explosion';
        this.cdr.detectChanges();
      }, 1200);

      setTimeout(() => {
        this.state = 'hidden';
        this.message = null;
        this.cdr.detectChanges();
      }, 2200);
    } else {
      setTimeout(() => {
        this.message = null;
        this.cdr.detectChanges();
      }, 3000);
    }
  }
}
