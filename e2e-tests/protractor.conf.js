//jshint strict: false
exports.config = {

  allScriptsTimeout: 11000,

  baseUrl: 'http://localhost:3000/',

  capabilities: {
    'browserName': 'chrome'
  },

  directConnect: true,

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  },

  specs: [
    '*.js'
  ]

};
