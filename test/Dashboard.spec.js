var requireSubvert = require('require-subvert')(__dirname),
  dashboardResponse = require('./fixtures/dashboard-response.json'),
  dashboardWithSectionResponse = require('./fixtures/dashboard-response-section.json'),
  Module = require('../lib/Module'),
  Datasource = require('../lib/Datasource'),
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

    moduleDataResponse = {
      'moduleConfig': {
        'info': [
          'Data source: Department for Work and Pensions'
        ],
        'value-attribute': 'number_of_transactions',
        'description': '',
        'module-type': 'kpi',
        'title': 'Transactions per year',
        'format': {
          'sigfigs': 3,
          'magnitude': true,
          'type': 'number'
        },
        'modules': [],
        'classes': 'cols3',
        'slug': 'transactions-per-year',
        'data-source': {
          'data-group': 'transactional-services',
          'data-type': 'summaries',
          'query-params': {
            'sort_by': '_timestamp:descending',
            'filter_by': [
              'service_id:dwp-carers-allowance-new-claims',
              'type:seasonally-adjusted'
            ],
            'flatten': true,
            'limit': 2
          }
        }
      },
      'dataSource': {
        'options': {
          'json': true,
          'backdrop': 'https://www.performance.service.gov.uk/',
          'url': 'https://www.performance.service.gov.uk/data/transactional-services/'
        },
        'data': [
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
        ]
      },
      'axes': {
        'x': {
          'label': 'Quarter',
          'key': [
            '_quarter_start_at',
            'end_at'
          ],
          'format': 'date'
        },
        'y': [
          {
            'label': 'Transactions per year',
            'key': 'number_of_transactions',
            'format': {
              'sigfigs': 3,
              'magnitude': true,
              'type': 'number'
            }
          }
        ]
      }
    };
  });

  afterEach(function () {
    Module.prototype.resolve.restore && Module.prototype.resolve.restore();
  });

  describe('init', function () {
    it('sets the dashboard slug and query options', function () {
      var dashboard = new Dashboard('test-slug');

      dashboard.options.should.eql({
        json: true,
        slug: 'test-slug',
        backdrop: 'https://www.performance.service.gov.uk/',
        stagecraft: 'https://stagecraft.production.performance.service.gov.uk/'
      });
    });

    it('allows you to set optional options', function () {
      var dashboard = new Dashboard('test-slug', {backdrop: 'foo.com', stagecraft: 'bar.com'});

      dashboard.options.should.eql({
        json: true,
        slug: 'test-slug',
        backdrop: 'foo.com',
        stagecraft: 'bar.com'
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
              slug: 'test-dashboard-slug',
              backdrop: 'https://www.performance.service.gov.uk/',
              stagecraft: 'https://stagecraft.production.performance.service.gov.uk/'
            });

          dashboardConfig.should.equal(dashboardResponse);
        });
    });

  });

  describe('getModule()', function () {

    it('should respond with a resolved modules data', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve(moduleDataResponse);

      return dashboard.getModule(module)
        .then(function (moduleData) {
          moduleData.dataSource.data.should.equal(moduleDataResponse.dataSource.data);
        });
    });

  });

  describe('resolve()', function () {
    var getConfigPromise,
        getModulePromise;

    beforeEach(function () {
      getConfigPromise = Q.defer();
      sinon.stub(Dashboard.prototype, 'getConfig').returns(getConfigPromise.promise);
    });

    afterEach(function () {
      Dashboard.prototype.getConfig.restore();
      Dashboard.prototype.getModule.restore && Dashboard.prototype.getModule.restore();
      Datasource.prototype.getData.restore && Datasource.prototype.getData.restore();
    });

    it('should respond with all modules and data for a dashboard', function () {
      var dashboard;
      getModulePromise = Q.defer();
      sinon.stub(Dashboard.prototype, 'getModule').returns(getModulePromise.promise);
      dashboard = new Dashboard('test-dashboard');

      getConfigPromise.resolve(dashboardResponse);
      getModulePromise.resolve(moduleDataResponse);

      return dashboard.resolve()
        .then(function (resolvedDashboard) {
          resolvedDashboard.title.should.equal('Company accounts filed');
          resolvedDashboard.modules.length.should.equal(5);
        });
    });

    it('should respond with nested modules for a section', function () {
      var dashboard,
        datasourceDeferred = Q.defer();

      Module.prototype.resolve.restore();
      sinon.stub(Datasource.prototype, 'getData').returns(datasourceDeferred.promise);
      dashboard = new Dashboard('test-dashboard');
      getConfigPromise.resolve(dashboardWithSectionResponse);
      datasourceDeferred.resolve(moduleDataResponse.dataSource.data);
      return dashboard.resolve()
        .then(function (resolvedDashboard) {
          var nestedModules = resolvedDashboard.modules[0].modules;
          resolvedDashboard.modules.length.should.equal(1);
          nestedModules.length.should.equal(2);
          nestedModules[0].moduleConfig.description
            .should.equal('Average score of satisfied responses');
        });
    });
  });

});
