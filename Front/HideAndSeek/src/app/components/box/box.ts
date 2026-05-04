import { Component, Input } from '@angular/core';
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

  get displayBox(): Box {
    return this.box ?? this;
  }

  constructor() {
    this.value = null;
    this.hider = null;
    this.revealed = false;
  }

  // Method to set the value of the box
  setValue(value: number, hider: boolean) {
    this.value = value;
    this.hider = hider;
  }

  // Method to reveal the box
  reveal() {
    this.revealed = true;
  }
  
}
