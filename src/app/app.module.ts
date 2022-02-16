import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import {ScribbleModule} from './modules/scribble/scribble.module';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ScribbleModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
