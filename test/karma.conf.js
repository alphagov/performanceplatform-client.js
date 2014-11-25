'use strict';

module.exports = function (karma) {
  karma.set({

    frameworks: ['mocha', 'sinon', 'chai', 'browserify'],

    files: [
      'dashboard.spec.js'
    ],

    reporters: ['spec'],

    preprocessors: {
      '*.spec.js': ['browserify']
    },

    browsers: ['PhantomJS'],

    logLevel: karma.LOG_INFO,

    singleRun: true,
    autoWatch: false,

    // browserify configuration
    browserify: {
      debug: false,
      transform: ['brfs']
    }
  });
};
