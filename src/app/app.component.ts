import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Drawing';
  paths;

  setPaths($event: object) {
    this.paths = $event;
  }
}
