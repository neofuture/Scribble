import {HostListener, AfterViewInit, Component, ElementRef, OnInit, ViewChild, AfterViewChecked} from '@angular/core';
// @ts-ignore
import * as drawing from '../../../assets/drawing.json';
import {FileService} from '../services/file.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'cs-scribble',
  templateUrl: './scribble.component.html',
  styleUrls: ['./scribble.component.css']
})
export class ScribbleComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @ViewChild('canvas', {read: ElementRef, static: false}) canvas: ElementRef;
  @ViewChild('canvasTools', {read: ElementRef, static: false}) canvasTools: ElementRef;
  @ViewChild('canvasGrid', {read: ElementRef, static: false}) canvasGrid: ElementRef;
  isDrawing: boolean;
  lastX: any;
  lastY: any;
  ctx: any;
  ctxGrid: any;
  ratio = 2;
  canvasElement: any;
  lineWidth = 10;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  colour = '#444444';
  mode = 'line';
  width: number;
  height: number;
  viewPortX = 0;
  viewPortY = 0;
  changed = false;
  drawing: any = (drawing as any).default;
  paths;
  hasLoaded = false;
  scale = 1;
  arcWidth;
  lineStartX: number;
  lineStartY: number;
  canvasToolsElement;
  canvasGridElement;
  ctxTools: any;
  private oldX = 0;
  private oldY = 0;
  private lineEndX: number;
  private lineEndY: number;
  zoomLevel = 2.6;
  private oldWidth: number;
  private oldHeight: number;
  private distance: number;
  colourFill = '#3377ff';
  fill: any;
  private shape: string;
  private fillStyle: string;
  private itemFill: any;
  kappa = 0.5522848;
  gridSize = 100;
  gridSizes = [
    {
      label: 'No Grid',
      value: 0
    }, {
      label: '50',
      value: 50
    }, {
      label: '100',
      value: 100
    }, {
      label: '150',
      value: 150
    }, {
      label: '200',
      value: 200
    }, {
      label: '250',
      value: 250
    }, {
      label: '500',
      value: 500
    }
  ];
  snap = true;
  private lockPanZoom = false;
  outline = true;
  hasColorInputSupport;
  private drawingLine = false;


  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resize();
  }

  constructor(
    private fileService: FileService
  ) {
  }

  over(event) {
    [this.x, this.y] = this.returnPosition(event, false);
    this.ctxTools.strokeStyle = '#3377ff';
    this.ctxTools.fillStyle = this.colour;
    this.ctxTools.lineJoin = 'round';
    this.ctxTools.lineCap = 'round';
    let cursor = this.lineWidth * this.scale;
    if (cursor < 20) {
      cursor = 20;
    }

    if (this.mode !== 'move') {
      if (!this.isDrawing) {

        this.ctxTools.fillStyle = '#3377ff';
        this.ctxTools.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);
        this.ctxTools.beginPath();
        this.ctxTools.arc(this.x, this.y, (cursor / 2), 0, 2 * Math.PI, false);
        this.ctxTools.fill();

        let x = this.x;
        let y = this.y;

        if (this.snap) {
          const snap = (this.gridSize * this.scale);
          x = Math.round((this.x - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
          y = Math.round((this.y - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        }
        this.ctxTools.fillStyle = this.colour;
        // this.ctxTools.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);
        this.ctxTools.beginPath();
        this.ctxTools.arc(x, y, (cursor / 2), 0, 2 * Math.PI, false);
        this.ctxTools.fill();

      }
    }
  }

  draw(event, touchEvents) {
    event.preventDefault();

    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.lineWidth = this.lineWidth * this.scale;

    this.ctxTools.lineJoin = 'round';
    this.ctxTools.lineCap = 'round';
    this.ctxTools.lineWidth = this.lineWidth * this.scale;

    if (!this.isDrawing) {
      return;
    }

    if (this.mode === 'move') {
      [this.x, this.y] = this.returnPosition(event, touchEvents);
      this.viewPortX -= (this.lastX - this.x) / this.scale;
      this.viewPortY -= (this.lastY - this.y) / this.scale;
      this.reDraw();
    }

    [this.x, this.y] = this.returnPosition(event, touchEvents);

    if (this.x !== this.lastX || this.y !== this.lastY) {
      if (this.mode === 'pen') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(this.x, this.y);
        this.ctx.stroke();
        this.changed = true;

        this.paths.push({
          p: this.computePoint()
        });
      }
    }

    this.ctxTools.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);


    // let x = this.lineEndX;
    // let y = this.lineEndY;
    //
    // if (this.snap) {
    //   const snap = (this.gridSize * this.scale);
    //
    //   x = (Math.round((this.lineEndX - (this.viewPortX % snap)) / snap) * snap) +
    //     (this.viewPortX % this.gridSize * this.scale);
    //   y = (Math.round((this.lineEndY - (this.viewPortY % snap)) / snap) * snap) +
    //     (this.viewPortY % this.gridSize * this.scale);
    // }
    //
    //
    // // this.ctxTools.beginPath();
    // // this.ctxTools.arc(x, y, (this.lineWidth / 2) * this.scale, 0, 2 * Math.PI, false);
    // // this.ctxTools.fill();

    this.lineEndX = this.x;
    this.lineEndY = this.y;


    if (this.mode === 'line') {
      this.drawingLine = true;
      if (event.shiftKey) {
        if (Math.abs(this.lineStartX - this.x) < Math.abs(this.lineStartY - this.y)) {
          this.lineEndX = this.lineStartX;
        } else {
          this.lineEndY = this.lineStartY;
        }
      }

      let lineEndX = this.lineEndX;
      let lineEndY = this.lineEndY;
      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);
        lineEndX = Math.round((lineEndX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineEndY = Math.round((lineEndY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
      }

      this.ctxTools.beginPath();
      this.ctxTools.moveTo(lineStartX, lineStartY);
      this.ctxTools.lineTo(lineEndX, lineEndY);
      this.ctxTools.stroke();

    }

    if (this.mode === 'square') {

      this.distance = 0;
      if (Math.abs(this.lineEndX - this.x) > Math.abs(this.lineEndY - this.y)) {
        this.distance = this.lineEndX - this.lineStartX;
      } else {
        this.distance = this.lineEndY - this.lineStartY;
      }


      if (event.shiftKey) {
        this.lineEndX = this.lineStartX + this.distance;
        this.lineEndY = this.lineStartY + this.distance;
      }
      this.ctxTools.fillStyle = this.colourFill;

      let lineEndX = this.lineEndX;
      let lineEndY = this.lineEndY;
      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineEndX = Math.round((lineEndX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineEndY = Math.round((lineEndY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
      }

      this.ctxTools.beginPath();
      this.ctxTools.moveTo(lineStartX, lineStartY);
      this.ctxTools.lineTo(lineStartX, lineEndY);
      this.ctxTools.lineTo(lineEndX, lineEndY);
      this.ctxTools.lineTo(lineEndX, lineStartY);
      this.ctxTools.lineTo(lineStartX, lineStartY);
      if (this.fill) {
        this.ctxTools.fill();
      }
      this.ctxTools.stroke();

    }

    if (this.mode === 'circle') {

      this.distance = 0;

      let lineEndX = this.lineEndX;
      let lineEndY = this.lineEndY;
      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineEndX = Math.round((lineEndX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineEndY = Math.round((lineEndY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
      }

      const x = lineStartX;
      const y = lineStartY;

      this.distance = 0;
      if (Math.abs(lineEndX - this.x) > Math.abs(lineEndY - this.y)) {
        this.distance = lineEndX - lineStartX;
      } else {
        this.distance = lineEndY - lineStartY;
      }
      if (event.shiftKey) {
        lineEndX = lineStartX + this.distance;
        lineEndY = lineStartY + this.distance;
      }

      const w = lineEndX - lineStartX;
      const h = lineEndY - lineStartY;

      if (Math.abs(lineEndX - this.x) > Math.abs(lineEndY - this.y)) {
        this.distance = lineEndX - lineStartX;
      } else {
        this.distance = lineEndY - lineStartY;
      }
      if (event.shiftKey) {
        this.lineEndX = lineStartX + this.distance;
        this.lineEndY = lineStartY + this.distance;
      }
      this.ctxTools.fillStyle = this.colourFill;

      const kappa = this.kappa;
      const ox = (w / 2) * kappa; // control point offset horizontal
      const oy = (h / 2) * kappa; // control point offset vertical
      const xe = x + w;           // x-end
      const ye = y + h;          // y-end
      const xm = x + w / 2;       // x-middle
      const ym = y + h / 2;       // y-middle

      this.ctxTools.beginPath();
      this.ctxTools.moveTo(x, ym);
      this.ctxTools.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      this.ctxTools.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      this.ctxTools.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      this.ctxTools.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
      if (this.fill) {
        this.ctxTools.fill();
      }
      this.ctxTools.stroke();
    }

    [this.lastX, this.lastY] = [this.x, this.y];
  }

  drawDot(event, touchEvents) {
    event.preventDefault();
    this.lockPanZoom = true;


    this.oldX = event.pageX;
    this.oldY = event.pageY;

    this.ctx.strokeStyle = this.colour;
    this.ctx.fillStyle = this.colourFill;

    this.ctxTools.strokeStyle = '#3377ff';
    this.ctxTools.fillStyle = this.colourFill;

    if (!this.isDrawing || this.mode === 'move') {
      return;
    }

    [this.x, this.y] = this.returnPosition(event, touchEvents);
    if (this.mode === 'pen') {
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, (this.lineWidth / 2) * this.scale, 0, 2 * Math.PI, false);
      this.ctx.fill();
      this.changed = true;
      this.paths.push({
        s: this.computePoint(), lineWidth: this.lineWidth, colour: this.ctx.strokeStyle
      });
    }

    if (this.mode === 'line') {

      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y);
      this.lineStartX = this.x;
      this.lineStartY = this.y;

      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        this.x = lineStartX;
        this.y = lineStartY;
        this.ctx.moveTo(lineStartX, lineStartY);
      }

      this.paths.push({
        s: this.computePoint(), lineWidth: this.lineWidth, colour: this.ctx.strokeStyle
      });
    }

    if (this.mode === 'square') {
      this.distance = 0;
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y);
      this.lineStartX = this.x;
      this.lineStartY = this.y;

      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        this.x = lineStartX;
        this.y = lineStartY;
        this.ctx.moveTo(lineStartX, lineStartY);
      }


      this.paths.push({
        s: this.computePoint(),
        lineWidth: this.lineWidth,
        colour: this.ctx.strokeStyle,
        fillStyle: this.ctx.fillStyle,
        shape: 'sq',
        fill: this.fill
      });
    }

    if (this.mode === 'circle') {
      this.distance = 0;
      this.ctx.beginPath();
      this.ctx.moveTo(this.x, this.y);
      this.lineStartX = this.x;
      this.lineStartY = this.y;

      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        this.x = lineStartX;
        this.y = lineStartY;
        this.ctx.moveTo(lineStartX, lineStartY);
      }

      this.paths.push({
        s: this.computePoint(),
        lineWidth: this.lineWidth,
        colour: this.ctx.strokeStyle,
        fillStyle: this.ctx.fillStyle,
        shape: 'ci',
        fill: this.fill
      });
    }


    // if (this.mode === 'move') {
    [this.lastX, this.lastY] = [this.x, this.y];
    // }
  }

  computePoint() {
    return [
      Math.round((this.x / this.scale) - this.viewPortX),
      Math.round((this.y / this.scale) - this.viewPortY)
    ];
  }

  endPath(event, touchEvents) {
    if (!this.isDrawing || this.mode === 'move') {
      this.ctxTools.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);
      return;
    }
    [this.x, this.y] = this.returnPosition(event, touchEvents);

    if (this.mode === 'line') {
      if (!this.drawingLine) {
        return false;
      }
      this.drawingLine = false;
      let lineEndX = this.lineEndX;
      let lineEndY = this.lineEndY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineEndX = Math.round((lineEndX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineEndY = Math.round((lineEndY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;

      }

      this.ctx.lineTo(lineEndX, lineEndY);
      this.x = lineEndX;
      this.y = lineEndY;
      this.ctx.stroke();
    }

    if (this.mode === 'square' && this.distance !== 0) {

      let lineEndX = this.lineEndX;
      let lineEndY = this.lineEndY;
      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineEndX = Math.round((lineEndX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineEndY = Math.round((lineEndY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        this.x = lineStartX;
        this.y = lineStartY;
        this.ctx.moveTo(lineStartX, lineStartY);
      }

      this.ctx.fillStyle = this.colourFill;
      this.ctx.lineTo(lineStartX, lineEndY);
      this.ctx.lineTo(lineEndX, lineEndY);
      this.ctx.lineTo(lineEndX, lineStartY);
      this.ctx.lineTo(lineStartX, lineStartY);
      if (this.fill) {
        this.ctx.fill();
      }
      if (this.outline) {
        this.ctx.stroke();
      }

      this.x = lineEndX;
      this.y = lineEndY;
    }

    if (this.mode === 'circle' && this.distance !== 0) {
      this.ctx.fillStyle = this.colourFill;

      let lineEndX = this.lineEndX;
      let lineEndY = this.lineEndY;
      let lineStartX = this.lineStartX;
      let lineStartY = this.lineStartY;

      if (this.snap) {
        const snap = (this.gridSize * this.scale);

        lineEndX = Math.round((lineEndX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineEndY = Math.round((lineEndY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        lineStartX = Math.round((lineStartX - this.viewPortX * this.scale) / snap) * snap + this.viewPortX * this.scale;
        lineStartY = Math.round((lineStartY - this.viewPortY * this.scale) / snap) * snap + this.viewPortY * this.scale;
        this.x = lineStartX;
        this.y = lineStartY;
        this.ctx.moveTo(lineStartX, lineStartY);
      }

      const x = lineStartX;
      const y = lineStartY;

      const w = lineEndX - lineStartX;
      const h = lineEndY - lineStartY;

      const kappa = this.kappa;
      const ox = (w / 2) * kappa; // control point offset horizontal
      const oy = (h / 2) * kappa; // control point offset vertical
      const xe = x + w;           // x-end
      const ye = y + h;          // y-end
      const xm = x + w / 2;       // x-middle
      const ym = y + h / 2;       // y-middle

      this.ctx.beginPath();
      this.ctx.moveTo(x, ym);
      this.ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
      this.ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
      this.ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
      this.ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
      if (this.fill) {
        this.ctx.fill();
      }
      if (this.outline) {
        this.ctx.stroke();
      }

      this.x = lineEndX;
      this.y = lineEndY;
    }

    this.ctxTools.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);

    this.paths.push({
      e: this.computePoint(),
      outline: this.outline
    });
    this.lockPanZoom = false;

  }

  cancelPath() {
    this.ctxTools.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);
    this.lockPanZoom = false;
  }

  ngOnInit() {
    this.hasColorInputSupport = (document) => {
      try {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = '!';
        return input.type === 'color' && input.value !== '!';
      } catch (e) {
        return false;
      };
    };

    this.paths = [];
    // for (const item of this.drawing) {
    //   this.paths.push(item);
    // }

    setTimeout(() => {
      this.autoCentre();
    }, 100);
  }

  ngAfterViewChecked() {
    if (this.hasLoaded) {
      if (this.width !== this.canvasElement.offsetWidth || this.height !== this.canvasElement.offsetHeight) {
        this.resize();
      }
    }
  }

  drawGrid() {
    if (this.gridSize !== 0) {
      this.ctxGrid.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);

      this.ctxGrid.lineWidth = 1;

      this.ctxGrid.strokeStyle = '#cccccc';

      let lines;
      if (this.canvasElement.offsetWidth > this.canvasElement.offsetHeight) {
        lines = (this.canvasElement.offsetWidth * 2) / this.gridSize;
      } else {
        lines = (this.canvasElement.offsetHeight * 2) / this.gridSize;
      }

      for (let i = 0 - this.gridSize; i < ((lines / this.scale) * this.gridSize) + this.gridSize; i = i + this.gridSize) {
        this.ctxGrid.beginPath();
        this.ctxGrid.moveTo(0, (i + (this.viewPortY % this.gridSize)) * this.scale);
        this.ctxGrid.lineTo(this.canvasElement.offsetWidth * 2, (i + (this.viewPortY % this.gridSize)) * this.scale);
        this.ctxGrid.stroke();
        this.ctxGrid.beginPath();
        this.ctxGrid.moveTo((i + (this.viewPortX % this.gridSize)) * this.scale, 0);
        this.ctxGrid.lineTo((i + (this.viewPortX % this.gridSize)) * this.scale, this.canvasElement.offsetHeight * 2);
        this.ctxGrid.stroke();
      }
    }
  }

  reDraw() {

    this.ctx.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);

    this.drawGrid();


    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.shape = '';
    this.fillStyle = '';
    this.fill = false;

    for (const item of this.paths) {
      if (typeof item.s !== 'undefined') {
        [this.x, this.y] = item.s;
        this.arcWidth = item.lineWidth;
        this.ctx.lineWidth = item.lineWidth * this.scale;

        this.ctx.strokeStyle = item.colour;
        this.ctx.fillStyle = item.fillStyle;

        this.itemFill = item.fill;
        this.shape = item.shape;

        this.ctx.beginPath();
        this.ctx.moveTo(
          (this.x + this.viewPortX) * this.scale,
          (this.y + this.viewPortY) * this.scale
        );
        this.lastX = this.x;
        this.lastY = this.y;

      }
      if (typeof item.p !== 'undefined') {
        [this.x, this.y] = item.p;
        this.ctx.lineTo(
          (this.x + this.viewPortX) * this.scale,
          (this.y + this.viewPortY) * this.scale
        );
      }
      if (typeof item.e !== 'undefined') {
        [this.x, this.y] = item.e;
        if (this.shape === 'sq') {
          this.ctx.lineTo((this.lastX + this.viewPortX) * this.scale, (this.y + this.viewPortY) * this.scale);
          this.ctx.lineTo((this.x + this.viewPortX) * this.scale, (this.y + this.viewPortY) * this.scale);
          this.ctx.lineTo((this.x + this.viewPortX) * this.scale, (this.lastY + this.viewPortY) * this.scale);
          this.ctx.lineTo((this.lastX + this.viewPortX) * this.scale, (this.lastY + this.viewPortY) * this.scale);
          if (this.itemFill) {
            this.ctx.fill();
          }
          if (item.outline) {
            this.ctx.stroke();
          }
        } else if (this.shape === 'ci') {

          const x = (this.x + this.viewPortX) * this.scale;
          const y = (this.y + this.viewPortY) * this.scale;

          const w = (this.lastX + this.viewPortX) * this.scale - (this.x + this.viewPortX) * this.scale;
          const h = (this.lastY + this.viewPortY) * this.scale - (this.y + this.viewPortY) * this.scale;

          const kappa = 0.5522848;
          const ox = (w / 2) * kappa; // control point offset horizontal
          const oy = (h / 2) * kappa; // control point offset vertical
          const xe = x + w;           // x-end
          const ye = y + h;          // y-end
          const xm = x + w / 2;       // x-middle
          const ym = y + h / 2;       // y-middle

          this.ctx.beginPath();
          this.ctx.moveTo(x, ym);
          this.ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
          this.ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
          this.ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
          this.ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
          if (this.itemFill) {
            this.ctx.fill();
          }
          if (item.outline) {
            this.ctx.stroke();
          }

        } else {
          if (this.x === this.lastX && this.y === this.lastY) {
            this.ctx.arc(
              (this.x + this.viewPortX) * this.scale,
              (this.y + this.viewPortY) * this.scale,
              (this.arcWidth / 2) * this.scale,
              0,
              2 * Math.PI,
              false);
            this.ctx.fill();
          } else {
            this.ctx.lineTo(
              (this.x + this.viewPortX) * this.scale,
              (this.y + this.viewPortY) * this.scale
            );
            this.ctx.stroke();
          }
        }
      }
    }
  }

  resize() {
    this.oldWidth = this.width;
    this.oldHeight = this.height;

    this.width = this.canvasElement.offsetWidth;
    this.height = this.canvasElement.offsetHeight;

    this.canvasElement.height = this.height * 2;
    this.canvasElement.width = this.width * 2;

    this.canvasToolsElement.height = this.height * 2;
    this.canvasToolsElement.width = this.width * 2;

    this.canvasGridElement.height = this.height * 2;
    this.canvasGridElement.width = this.width * 2;

    if (!isNaN(this.oldWidth)) {
      this.viewPortX -= this.oldWidth - this.width;
      this.viewPortY -= this.oldHeight - this.height;
    }
    this.reDraw();
  }

  autoCentre() {
    const oldScale = this.scale;

    this.scale = 1;
    let minX = 999999;
    let minY = 999999;
    let maxX = -999999;
    let maxY = -999999;
    let x = 0;
    let y = 0;
    for (const item of this.paths) {
      if (typeof item.s !== 'undefined') {
        [x, y] = item.s;
      }
      if (typeof item.p !== 'undefined') {
        [x, y] = item.p;
      }
      if (typeof item.e !== 'undefined') {
        [x, y] = item.e;
      }

      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
    }

    const width = (maxX - minX);
    const height = (maxY - minY);

    this.viewPortX = 0 - minX + (this.width - (width / 2));
    this.viewPortY = 0 - minY + (this.height - (height / 2));

    this.zoomLevel = oldScale;
    this.zoomIn();

    this.reDraw();
  }

  ngAfterViewInit() {
    this.canvasElement = this.canvas.nativeElement;
    this.canvasToolsElement = this.canvasTools.nativeElement;
    this.canvasGridElement = this.canvasGrid.nativeElement;


    this.canvasToolsElement.addEventListener('touchstart', (event) => {
      this.isDrawing = true;
      [this.lastX, this.lastY] = this.returnPosition(event, true);
      this.drawDot(event, true);
    });
    this.canvasToolsElement.addEventListener('touchmove', (event) => {
      this.draw(event, true);
      this.over(event);
      [this.lastX, this.lastY] = this.returnPosition(event, true);
    });
    this.canvasToolsElement.addEventListener('touchend', (event) => {
      this.endPath(event, true);
      this.isDrawing = false;
    });




    this.canvasToolsElement.addEventListener('mousedown', (event) => {
      this.isDrawing = true;
      [this.lastX, this.lastY] = this.returnPosition(event, false);
      this.drawDot(event, false);
    });
    this.canvasToolsElement.addEventListener('mousemove', (event) => {
      this.draw(event, false);
      this.over(event);
    });
    this.canvasToolsElement.addEventListener('mouseover', (event) => {
      this.over(event);
    });
    this.canvasToolsElement.addEventListener('mouseup', (event) => {
      this.endPath(event, false);
      this.isDrawing = false;
    });
    this.canvasToolsElement.addEventListener('mouseout', (event) => {
      if (this.mode !== 'line') {
        this.endPath(event, false);
        this.isDrawing = false;
      } else {
        this.cancelPath();
        this.isDrawing = false;
      }
    });


    this.ctx = this.canvasElement.getContext('2d');
    this.ctxTools = this.canvasToolsElement.getContext('2d');
    this.ctxGrid = this.canvasGridElement.getContext('2d');

    this.offsetX = this.canvasElement.offsetLeft;
    this.offsetY = this.canvasElement.offsetTop;

    this.canvasElement.height = this.height * 2;
    this.canvasElement.width = this.width * 2;

    this.canvasToolsElement.height = this.height * 2;
    this.canvasToolsElement.width = this.width * 2;

    setTimeout(() => {
      this.resize();
      this.hasLoaded = true;
    });


    this.canvasToolsElement.onwheel = (event) => {
      this.wheelInit(event);
    };
  }

  wheelInit(event) {
    event.preventDefault();

    if (this.lockPanZoom) {
      return false;
    }

    const [centerX, centerY] = this.returnPosition(event, false);

    const wheel = event.deltaY;
    const zoom = Math.exp(wheel * 0.002);
    if (this.scale > 7) {
      this.scale = 7;
    }
    if (this.scale < 7 || wheel < 1) {
      this.viewPortX += centerX / (this.scale * zoom) - centerX / this.scale;
      this.viewPortY += centerY / (this.scale * zoom) - centerY / this.scale;
      this.scale *= zoom;
      this.zoomLevel = this.scale;
      this.reDraw();
      this.over(event);
    }
  }

  zoomIn() {
    const centerX = this.canvasElement.width / 2;
    const centerY = this.canvasElement.height / 2;
    this.viewPortX += centerX / (this.zoomLevel) - centerX / this.scale;
    this.viewPortY += centerY / (this.zoomLevel) - centerY / this.scale;
    this.scale = this.zoomLevel;
    this.reDraw();
  }

  returnPosition(event, touchEvents) {
    const bounds = event.target.getBoundingClientRect();
    let x;
    let y;
    if (touchEvents === true) {

      if (typeof event.touches[0] === 'undefined') {
        return [this.lastX, this.lastY];
      }

      x = (event.touches[0].pageX - bounds.left) * this.ratio;
      y = (event.touches[0].pageY - bounds.top) * this.ratio;
    } else {
      x = (event.clientX - bounds.left) * this.ratio;
      y = (event.clientY - bounds.top) * this.ratio;
    }
    return [x, y];
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvasElement.offsetWidth * 2, this.canvasElement.offsetHeight * 2);
    this.paths = [];
    this.scale = 1;
    this.viewPortY = 0;
    this.viewPortX = 0;
    this.drawGrid();
  }

  zoom() {
    this.scale = 1;
    this.autoCentre();
    this.reDraw();
  }

  undo() {
    let spliceAt = 0;
    for (const item of Object.keys(this.paths)) {
      if (typeof this.paths[item].e !== 'undefined') {
        spliceAt = parseInt(item, 10);
      }
    }
    this.paths.length = spliceAt;
    this.reDraw();
  }

  setMode(mode: string) {
    this.mode = mode;
  }

  save() {
    this.fileService.downloadJson(JSON.stringify(this.paths), 'drawing.txt');
  }


  uploadDrawing(event) {
    const selectedFile = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = () => {
      this.paths = JSON.parse(atob(reader.result.toString().replace('data:text/plain;base64,', '')));
      this.reDraw();
      this.autoCentre();
      this.zoom();
      // this.paths = JSON.parse(reader.result);
    };
  }
}
