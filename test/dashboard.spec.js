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

    var module, moduleDataResponse;

    beforeEach(function () {

      module = {
        'title': 'test',
        'format': 'format',
        'module-type': 'kpi',
        'value-attribute': 'specific_data',
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

      moduleDataResponse = [
        {
          '_quarter_start_at': '2013-07-01T00:00:00+00:00',
          'specific_data': 'foo'
        },
        {
          '_quarter_start_at': '2013-04-01T00:00:00+00:00',
          'specific_data': 'bar'
        },
        {
          '_quarter_start_at': '2013-01-01T00:00:00+00:00',
          'specific_data': 'hum'
        }
      ];

    });

    it('should respond with a resolved KPI modules data', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getKPI(module)
        .then(function (kpiData) {
          kpiData.data.should.equal(moduleDataResponse);
        });
    });

    it('should return with axes data for the module', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getKPI(module)
        .then(function (kpiData) {
          kpiData.axes.x.should.eql({
            'label': 'Quarter',
            'key': '_quarter_start_at',
            'format': 'date'
          });

          kpiData.axes.y.should.eql([{
            label: 'test',
            key: 'specific_data',
            format: 'format'
          }]);
        });
    });

    it('should respond with tabular data for the module', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getKPI(module)
        .then(function (kpiData) {
          kpiData.tabularData.should.eql([
            [
              'Quarter',
              '2013-07-01T00:00:00+00:00',
              '2013-04-01T00:00:00+00:00',
              '2013-01-01T00:00:00+00:00'
            ],
            [
              'test',
              'foo',
              'bar',
              'hum'
            ]
          ]);

        });
    });
  });

});
