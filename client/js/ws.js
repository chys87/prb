'use strict';

module.exports = class WS {
  constructor(host) {
    let ws = this.ws = new WebSocket(host);
    ws.onopen = this.onopen.bind(this);
    ws.onmessage = this.onmessage.bind(this);
    ws.onerror = this.onerror.bind(this);
    ws.onclose = this.onclose.bind(this);

    this.response_handler = new Map;
    this.reqid_counter = Math.floor(1e8 * Math.random());
  }
  raw_send(msg) {
    this.ws.send(msg);
  }
  send(op, req, cb) {
    let reqid = ++this.reqid_counter;
    req = Object.assign({}, req, {reqid, op});
    this.ws.send(JSON.stringify(req));
    this.response_handler.set(reqid, cb);
  }
  onopen() {
  }
  onmessage(e) {
    let msg = JSON.parse(e.data);
    let handler = this.response_handler.get(msg.reqid);
    this.response_handler.delete(msg.reqid);
    if (msg.error) {
      alert(msg.error);
      console.error(msg.error);
    } else if (handler) {
      handler(msg);
    } else {
      console.error(`Unrecognized reqid: ${msg.reqid}`);
    }
  }
  onerror() {
  }
  onclose() {
  }
};
