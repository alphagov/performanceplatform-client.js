var requireSubvert = require('require-subvert')(__dirname),
  dashboardResponse = require('./fixtures/dashboard-response.json'),
  Module = require('../lib/Module'),
  Q = require('q');

describe('Dashboard', function () {
  var Dashboard,
    stub,
    deferred;

  var module, moduleDataResponse;

  beforeEach(function () {
    deferred = Q.defer();
    stub = sinon.stub().returns(deferred.promise);
    requireSubvert.subvert('../lib/request-promise', stub);
    Dashboard = requireSubvert.require('../lib/Dashboard');
    sinon.stub(Module.prototype, 'resolve').returns(deferred.promise);
    module = {
      'title': 'test',
      'format': {
        'type': 'number'
      },
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
        '_timestamp': '2013-07-01T00:00:00+00:00',
        'end_at': '2014-07-01T00:00:00+00:00',
        'specific_data': 1
      },
      {
        '_quarter_start_at': '2013-04-01T00:00:00+00:00',
        '_timestamp': '2013-07-01T00:00:00+00:00',
        'end_at': '2014-07-01T00:00:00+00:00',
        'specific_data': 2
      },
      {
        '_quarter_start_at': '2013-01-01T00:00:00+00:00',
        '_timestamp': '2013-07-01T00:00:00+00:00',
        'end_at': '2014-07-01T00:00:00+00:00',
        'specific_data': 1
      }
    ];
  });

  afterEach(function () {
    Module.prototype.resolve.restore();
  });

  describe('init', function () {
    it('sets the dashboard slug and query options', function () {
      var dashboard = new Dashboard('test-slug');

      dashboard.options.should.eql({
        json: true,
        slug: 'test-slug'
      });
    });
  });

  describe('getConfig()', function () {

    it('Should respond with a dashboard config', function () {

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
              slug: 'test-dashboard-slug'
            });

          dashboardConfig.should.equal(dashboardResponse);
        });
    });

  });

  describe('getModule()', function () {

    it('should respond with a resolved modules data', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getModule(module)
        .then(function (moduleData) {
          moduleData.data.should.equal(moduleDataResponse);
        });
    });

  });

  describe('resolve()', function () {
    var getConfigPromise,
        getModulePromise;

    beforeEach(function () {
      getConfigPromise = Q.defer();
      getModulePromise = Q.defer();
      sinon.stub(Dashboard.prototype, 'getConfig').returns(getConfigPromise.promise);
      sinon.stub(Dashboard.prototype, 'getModule').returns(getModulePromise.promise);
    });

    afterEach(function () {
      Dashboard.prototype.getConfig.restore();
      Dashboard.prototype.getModule.restore();
    });

    it('should respond with all modules and data for a dashboard', function () {

      var dashboard = new Dashboard('test-dashboard');

      getConfigPromise.resolve(dashboardResponse);

      getModulePromise.resolve(moduleDataResponse);

      return dashboard.resolve()
        .then(function (resolvedDashboard) {
          resolvedDashboard.title.should.equal('Company accounts filed');
          resolvedDashboard.modules.length.should.equal(5);
          resolvedDashboard.modules.should.eql([
            [
              {
                '_quarter_start_at': '2013-07-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-04-01T00:00:00+00:00',
                'specific_data': 2,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-01-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              }
            ],
            [
              {
                '_quarter_start_at': '2013-07-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-04-01T00:00:00+00:00',
                'specific_data': 2,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-01-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              }
            ],
            [
              {
                '_quarter_start_at': '2013-07-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-04-01T00:00:00+00:00',
                'specific_data': 2,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-01-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              }
            ],
            [
              {
                '_quarter_start_at': '2013-07-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-04-01T00:00:00+00:00',
                'specific_data': 2,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-01-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              }
            ],
            [
              {
                '_quarter_start_at': '2013-07-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-04-01T00:00:00+00:00',
                'specific_data': 2,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              },
              {
                '_quarter_start_at': '2013-01-01T00:00:00+00:00',
                'specific_data': 1,
                '_timestamp': '2013-07-01T00:00:00+00:00',
                'end_at': '2014-07-01T00:00:00+00:00'
              }
            ]
          ]);
        });
    });

  });

});
