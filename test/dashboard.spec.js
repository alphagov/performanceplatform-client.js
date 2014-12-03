var requireSubvert = require('require-subvert')(__dirname),
  dashboardResponse = require('./fixtures/dashboard-response.json'),
  Q = require('q'),
  _ = require('underscore');

describe('Dashboard', function () {
  var Dashboard,
      stub,
      deferred;

  var module, moduleDataResponse;

  beforeEach(function () {
    deferred = Q.defer();
    stub = sinon.stub().returns(deferred.promise);
    requireSubvert.subvert('../lib/request-promise', stub);
    Dashboard = requireSubvert.require('../lib/dashboard');
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

  describe('getModule()', function () {


    it('should respond with a resolved KPI modules data', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getModule(module)
        .then(function (kpiData) {
          kpiData.data.should.equal(moduleDataResponse);
        });
    });

    it('should return with axes data for the module', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getModule(module)
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

    it('should return the axes from the dashboard if one is present', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      var setAxes = {
        axes: {
          x: {
            label: 'test',
            key: 'test',
            format: 'format'
          },
          y: [
            {
              label: 'test',
              key: 'test',
              format: 'format'
            }
          ]
        }
      };

      var moduleWithAxes = _.extend(module, setAxes);

      return dashboard.getModule(moduleWithAxes)
        .then(function (kpiData) {
          kpiData.axes.should.eql(setAxes.axes);
        });
    });

    it('should respond with tabular data for the module', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getModule(module)
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

  describe('getDashboardMetrics()', function () {
    it('returns a resolved dashboard and metrics', function () {
      var getConfigPromise = Q.defer();
      var getModulePromise = Q.defer();
      sinon.stub(Dashboard.prototype, 'getConfig').returns(getConfigPromise.promise);
      sinon.stub(Dashboard.prototype, 'getModule').returns(getModulePromise.promise);

      var dashboard = new Dashboard('test-dashboard');

      getConfigPromise.resolve(dashboardResponse);

      getModulePromise.resolve(moduleDataResponse);

      return dashboard.getDashboardMetrics()
        .then(function (resolvedDashboard) {
          resolvedDashboard.title.should.equal('Company accounts filed');
          resolvedDashboard.modules.length.should.equal(3);
          resolvedDashboard.modules.should.eql([
            [
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
            ],
            [
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
            ],
            [
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
            ]
          ]);
        });

    });
  });

});
