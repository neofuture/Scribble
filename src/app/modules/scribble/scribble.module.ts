import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScribbleComponent } from './scribble.component';
import {FormsModule} from '@angular/forms';
import {
  ButtonModule,
  CheckboxModule,
  ColorPickerModule,
  DropdownModule,
  RadioButtonModule,
  SliderModule,
  SpinnerModule,
  TooltipModule
} from 'primeng';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  declarations: [ScribbleComponent],
  exports: [
    ScribbleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SliderModule,
    ButtonModule,
    RadioButtonModule,
    ColorPickerModule,
    TooltipModule,
    CheckboxModule,
    SpinnerModule,
    DropdownModule,
    BrowserAnimationsModule
  ]
})
export class ScribbleModule { }
