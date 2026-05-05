import { Component, Input, ChangeDetectorRef, Output, EventEmitter} from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-box',
  imports: [NgClass],
  templateUrl: './box.html',
  styleUrl: './box.css',
})
export class Box {
  // 1. Accept the plain data object as an input
  @Input() data!: { value: number, hider: boolean };

  @Output() boxClicked = new EventEmitter<void>();
  revealed: boolean = false;
  state: 'unsmashed' | 'smashing' | 'treasure' | 'bomb' | 'explosion' | 'hidden' = 'unsmashed';
  treasureGifPath = '/assets/treasure-chest.gif';
  bombGifPath = '/assets/bomb-explosion.gif';
  message: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  // 2. The reveal method now reads directly from the data input
  reveal() {
    if (this.state !== 'unsmashed') return;

    this.boxClicked.emit();
    this.revealed = true;
    this.state = 'smashing';
    this.cdr.detectChanges();

    // Read the hider status from the injected data
    const isHider = this.data.hider;

    setTimeout(() => {
      if (isHider) {
        this.state = 'treasure';
        this.message = 'ARRR! Found the treasure!';
      } else {
        this.state = 'bomb';
        this.message = 'BOOM! You hit a booby trap! Pieces of eight scattered...';
      }
      this.cdr.detectChanges();
    }, 600);

    if (!isHider) {
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
