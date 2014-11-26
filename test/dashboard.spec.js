var requireSubvert = require('require-subvert')(__dirname),
  dashboardResponse = require('./fixtures/sample-dashboard.json'),
  Q = require('q');

describe('Dashboard', function () {
  var Dashboard,
      stub,
      deferred;

  beforeEach(function () {
    deferred = Q.defer();
    stub = sinon.stub().returns(deferred.promise);
    requireSubvert.subvert('../lib/request-promise', stub);
    Dashboard = requireSubvert.require('../lib/dashboard');
  });

  describe('getConfig()', function () {

    it('Should respond with a dashboard', function () {

      var dashboard = new Dashboard();
      var testSlug = 'test-dashboard-slug';

      deferred.resolve(dashboardResponse);

      return dashboard.getConfig(testSlug)
        .then(function (dashboardConfig) {

          stub.should.be.calledOnce;
          stub.getCall(0).args[0]
            .should.eql({
              url:
                'https://stagecraft.production.performance.service.gov.uk/public/dashboards?slug=' +
                  testSlug
            });

          dashboardConfig.should.equal(dashboardResponse);
        });
    });

  });

});
