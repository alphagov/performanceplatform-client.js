var requireSubvert = require('require-subvert')(__dirname),
  dashboardResponse = require('./fixtures/dashboard-response.json'),
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

  describe('init', function () {
    it('sets the dashboard slug and query options', function () {
      var dashboard = new Dashboard('test-slug');

      dashboard.options.should.eql({
        json: true,
        useQuerystring: true,
        slug: 'test-slug'
      });
    });
  });

  describe('getConfig()', function () {

    it('Should respond with a dashboard', function () {

      var testSlug = 'test-dashboard-slug';
      var dashboard = new Dashboard(testSlug);

      deferred.resolve(dashboardResponse);

      return dashboard.getConfig()
        .then(function (dashboardConfig) {

          stub.should.be.calledOnce;
          stub.getCall(0).args[0]
            .should.eql({
              url:
                'https://stagecraft.production.performance.service.gov.uk/public/dashboards?slug=' +
                  testSlug,
              json: true,
              useQuerystring: true,
              slug: 'test-dashboard-slug'
            });

          dashboardConfig.should.equal(dashboardResponse);
        });
    });

  });

  describe('getKPI()', function () {
    it('should respond with a resolved KPI modules data', function () {
      var module = {
        'module-type': 'kpi',
        'data-source': {
          'data-group': 'transactional-services',
          'data-type': 'summaries',
          'query-params': {
            'sort_by': '_timestamp:descending',
            'filter_by': [
              'service_id:bis-accounts-filing',
              'type:seasonally-adjusted'
            ]
          }
        }
      };

      var moduleDataResponse = [{}, {}, {}];

      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getKPI(module)
        .then(function (kpiData) {
          kpiData.data.should.equal(moduleDataResponse);
        });
    });
  });

});
