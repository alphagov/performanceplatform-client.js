var dashboardResponse = require('./fixtures/sample-dashboard.json'),
  Q = require('q'),
  _ = require('underscore');

describe('Dashboard', function () {
  var deferred,
    Dashboard;

  beforeEach(function () {
    deferred = Q.defer();
    this.server = sinon.fakeServer.create();
    //this.server.autoRespond = true;
    //this.server.autoRespondAfter = 0;
    this.server.respondWith(/.*/,
        [200, { 'Content-Type': 'application/json' }, JSON.stringify(dashboardResponse)]);
    Dashboard = require('../lib/dashboard');
  });

  afterEach(function () {
    this.server.restore();
  });

  describe('getConfig()', function () {

    it('Should respond with a dashboard', function () {

      var dashboard = new Dashboard();
      var testSlug = 'test-dashboard-slug';
      var testConfig = dashboard.getConfig();
      var self = this;




      return testConfig
        .then(function () {
            console.log(self.server);
          }
      );

    });

  });

});
