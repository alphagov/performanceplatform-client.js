var dashboardResponse = require('./fixtures/sample-dashboard.json'),
  Q = require('q');

describe('Dashboard', function () {
  var deferred,
    Dashboard,
    Query = require('../lib/querist');

  beforeEach(function () {
    deferred = Q.defer();
    sinon.stub(Query.prototype, 'get').returns(deferred.promise);
    Dashboard = require('../lib/dashboard');
  });

  afterEach(function () {
    Query.prototype.get.restore();
  });

  describe('getConfig()', function () {

    it('Should respond with a dashboard', function () {

      var dashboard = new Dashboard();
      var testSlug = 'test-dashboard-slug';

      deferred.resolve(dashboardResponse);

      return dashboard.getConfig(testSlug)
        .then(function (dashboardConfig) {

          Query.prototype.get.should.be.calledOnce;
          Query.prototype.get.getCall(0).args[0]
            .should.equal('/public/dashboards?slug=' + testSlug);

          dashboardConfig.should.equal(dashboardResponse);
        });
    });

  });

});
