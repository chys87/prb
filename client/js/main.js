'use strict';

const WS = require('./ws');
const {htmlEncode, hE} = require('./utils');

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
    this.raw_send(require('./auth').gen_auth_data(this._pass));
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

    let $files = $('#sec_dir .files').empty();
    if (path && path != '/') {
      $('<figure class="link_dir dir"><figcaption>..</figcaption></figure>').appendTo($files);
    }
    for (let entry of res.list) {
      var $file = $('<figure/>');
      $file.append($('<figcaption/>').text(entry.name));
      if (entry.dir) {
        $file.addClass('link_dir dir');
        $file[0].dataset.link = path + '/' + entry.name;
      } else {
        $file.addClass('file');
      }
      if (entry.symlink)
        $file.addClass('symlink');
      $file.appendTo($files);
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
