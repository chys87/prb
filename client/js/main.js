'use strict';

const WS = require('./ws');
const {htmlEncode} = require('./utils');

const body = document.body;

const state = {
  set step(step) { body.dataset.step = step; },
  get step() { return body.dataset.step; },
  set conn(conn) { this._conn = conn; },
  get conn() { return this._conn; },
};

class PrbWS extends WS {
  constructor(host, pass) {
    super(host);
    this._pass = pass;
  }
  get valid() { return state.conn === this; }
  onopen() {
    state.conn = this;
    this.raw_send(this._pass);
    this.ls('');
  }
  onerror(e) {
    if (this.valid) {
      console.error(e);
      alert('WebSocket connection error');
      state.conn = null;
      state.step = 'login';
    }
  }
  onclose(e) {
    if (this.valid) {
      console.error(e);
      alert('Connection lost');
      state.conn = null;
      state.step = 'login';
    }
  }

  ls(path) {
    if (!this.valid)
      return;
    path = path.replace(/^\/+|\/+$/g, '');
    this.send('ls', {path}, (res) => { this.lsBack(path, res) });
  }
  lsBack(path, res) {
    if (!this.valid)
      return;
    state.step = 'dir';

    let $curdir = $('#sec_dir .cur_dir');
    let html = '<span class="link_dir" data-link="">Home</span>';
    let totalParts = '';
    for (let part of path.split('/')) {
      if (!part)
        continue;
      totalParts += '/' + part;
      html += `<i></i><span class="link_dir" data-link="${htmlEncode(totalParts)}">${htmlEncode(part)}</span>`;
    }
    $curdir.html(html);

    let $ul = $('#sec_dir > ul').empty();
    for (let entry of res.list) {
      var $li = $('<li/>').text(entry.name);
      if (entry.dir) {
        $li.addClass('link_dir dir');
        $li[0].dataset.link = path + '/' + entry.name;
      }
      $li.appendTo($ul);
    }
  }
}

$('#sec_login > form').submit(function(e) {
  e.preventDefault();
  const host = this.prb_host.value;
  const pass = this.prb_pass.value;
  new PrbWS(host, pass);
});

$('#sec_dir').on('click', '.link_dir', function(e) {
  let path = this.dataset.link;
  if (path !== undefined)
    state.conn.ls(path);
});

// Start
state.step = 'login';
