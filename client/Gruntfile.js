'use strict';

const fs = require('fs');
const path = require('path');

const mkdirp = require('mkdirp');

module.exports = grunt => {

  mkdirp.sync(path.join(__dirname, 'gen'));
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      all: ['gen/**.*'],
    },
    sass: { main: {
      options: {outputStyle: 'compact', sourceMap: 'none'},
      files: {'gen/main.css': 'main.scss'},
    }},
    webpack: { main: {
      entry: './js/main.js',
      output: {
        path: 'gen',
        filename: 'main.js',
        sourcePrefix: '',
        pathinfo: true,
      },
      externals: {
        jquery: 'var jQuery',
      },
      node: {
        Buffer: false,
      },
    }},
    watch: {
      sass: {files: ['*.scss'], tasks: ['sass']},
      webpack: {
        files: ['js/**.js', 'Gruntfile.js'],
        tasks: ['webpack'],
      },
      html: {
        files: ['main.html'],
        tasks: [],
      },
      options: {
        livereload: true
      }
    },
  });

  grunt.registerTask('default', ['sass', 'webpack']);
};
