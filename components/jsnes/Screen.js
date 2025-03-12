import React, { Component } from 'react';

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;

class Screen extends Component {
  render() {
    console.log({ width: this.props.width, height: this.props.height });
    return (
      <canvas
        className="Screen"
        width={this.props.width}
        height={this.props.height}
        onMouseDown={this.handleMouseDown}
        style={{
          border: '1px solid red',
          imageRendering: 'pixelated',
          width: `${this.props.width}px`,
          height: `${this.props.height}px`,
        }}
        onMouseUp={this.props.onMouseUp}
        ref={canvas => {
          this.canvas = canvas;
        }}
      />
    );
  }

  componentDidMount() {
    this.initCanvas();
  }

  componentDidUpdate() {
    this.initCanvas();
  }

  initCanvas() {
    this.context = this.canvas.getContext('2d');
    this.imageData = this.context.getImageData(0, 0, this.props.width, this.props.height);

    this.context.fillStyle = 'black';
    // set alpha to opaque
    this.context.fillRect(0, 0, this.props.width, this.props.height);

    // buffer to write on next animation frame
    this.buf = new ArrayBuffer(this.imageData.data.length);
    // Get the canvas buffer in 8bit and 32bit
    this.buf8 = new Uint8ClampedArray(this.buf);
    this.buf32 = new Uint32Array(this.buf);

    // Set alpha
    for (var i = 0; i < this.buf32.length; ++i) {
      this.buf32[i] = 0xff000000;
    }
  }

  setBuffer = buffer => {
    var i = 0;
    for (var y = 0; y < this.props.height; ++y) {
      for (var x = 0; x < this.props.width; ++x) {
        i = y * 256 + x;
        // Convert pixel from NES BGR to canvas ABGR
        this.buf32[i] = 0xff000000 | buffer[i]; // Full alpha
      }
    }
  };

  writeBuffer = () => {
    this.imageData.data.set(this.buf8);
    this.context.putImageData(this.imageData, 0, 0);
  };

  fitInParent = () => {
    let parent = this.canvas.parentNode;
    // @ts-ignore
    let parentWidth = parent.clientWidth;
    // @ts-ignore
    let parentHeight = parent.clientHeight;
    let parentRatio = parentWidth / parentHeight;
    let desiredRatio = this.props.width / this.props.height;
    if (desiredRatio < parentRatio) {
      this.canvas.style.width = `${Math.round(parentHeight * desiredRatio)}px`;
      this.canvas.style.height = `${parentHeight}px`;
    } else {
      this.canvas.style.width = `${parentWidth}px`;
      this.canvas.style.height = `${Math.round(parentWidth / desiredRatio)}px`;
    }
  };

  screenshot() {
    var img = new Image();
    img.src = this.canvas.toDataURL('image/png');
    return img;
  }

  handleMouseDown = e => {
    if (!this.props.onMouseDown) return;
    // Make coordinates unscaled
    let scale = this.props.width / parseFloat(this.canvas.style.width);
    let rect = this.canvas.getBoundingClientRect();
    let x = Math.round((e.clientX - rect.left) * scale);
    let y = Math.round((e.clientY - rect.top) * scale);
    this.props.onMouseDown(x, y);
  };
}

export default Screen;
