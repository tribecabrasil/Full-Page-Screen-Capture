export class HistoryStack {
  constructor(limit = 50) {
    this.limit = limit;
    this.stack = [];
    this.position = -1;
  }

  push(state) {
    this.stack = this.stack.slice(0, this.position + 1);
    this.stack.push(state);
    if (this.stack.length > this.limit) {
      this.stack.shift();
    }
    this.position = this.stack.length - 1;
  }

  undo() {
    if (this.position <= 0) {
      return null;
    }
    this.position -= 1;
    return this.stack[this.position];
  }

  redo() {
    if (this.position >= this.stack.length - 1) {
      return null;
    }
    this.position += 1;
    return this.stack[this.position];
  }

  canUndo() {
    return this.position > 0;
  }

  canRedo() {
    return this.position < this.stack.length - 1;
  }
}