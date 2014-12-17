var requireSubvert = require('require-subvert')(__dirname),
  dashboardResponse = require('./fixtures/dashboard-response.json'),
  Q = require('q'),
  _ = require('lodash');

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

    it('should return the axes from the dashboard if one is present', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      var setAxes = {
        axes: {
          x: {
            label: 'Quarter',
            key: ['_quarter_start_at', 'end_at'],
            format: 'date'
          },
          y: [
            {
              label: 'test',
              key: 'specific_data',
              format: {
                type: 'number'
              }
            }
          ]
        }
      };

      var moduleWithAxes = _.extend(module, setAxes);

      return dashboard.getModule(moduleWithAxes)
        .then(function (moduleData) {
          moduleData.axes.should.eql(setAxes.axes);
        });
    });

    it('should respond with tabular data for the module', function () {
      var dashboard = new Dashboard('test-dashboard');

      deferred.resolve({
        data: moduleDataResponse
      });

      return dashboard.getModule(module)
        .then(function (moduleData) {
          moduleData.tabularData.should.eql([
            [
              'Quarter',
              '1 July 2013 to 30 June 2014',
              '1 April 2013 to 30 June 2014',
              '1 January 2013 to 30 June 2014'
            ],
            [
              'test',
              '1',
              '2',
              '1'
            ]
          ]);

        });
    });

    describe('formatted keys', function () {
      it('should add extra formatting keys', function () {
        var dashboard = new Dashboard('test-dashboard');

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {
            moduleData.data[0].should.have.keys(
              [
                'formatted_value',
                '_quarter_start_at',
                'specific_data',
                '_timestamp',
                'end_at',
                'formatted_date_range',
                'formatted_change_from_previous',
                'formatted_end_at',
                'formatted_start_at'
              ]
            );
          });
      });

      it('should only add a delta key if theres a previous model', function () {
        var dashboard = new Dashboard('test-dashboard');

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {
            moduleData.data[2].should.have.keys(
              [
                'formatted_value',
                '_quarter_start_at',
                'specific_data',
                '_timestamp',
                'end_at',
                'formatted_date_range',
                'formatted_end_at',
                'formatted_start_at'
              ]
            );
          });
      });

      it('should not add a delta key if the data format is not currency, number or duration',
        function () {
          var dashboard = new Dashboard('test-dashboard');

          deferred.resolve({
            data: moduleDataResponse
          });

          module.format.type = 'text';

          return dashboard.getModule(module)
            .then(function (moduleData) {
              moduleData.data[2].should.have.keys(
                [
                  'formatted_value',
                  '_quarter_start_at',
                  'specific_data',
                  '_timestamp',
                  'end_at',
                  'formatted_date_range',
                  'formatted_end_at',
                  'formatted_start_at'
                ]
              );
            });
        });

      it('adds a period key if one is available in the query-params', function () {
        var dashboard = new Dashboard('test-dashboard');

        deferred.resolve({
          data: moduleDataResponse
        });

        module['data-source'] = {
          'query-params': {
            period: 'week'
          }
        };

        return dashboard.getModule(module)
          .then(function (moduleData) {
            moduleData.data[0].period.should.equal('week');
          });
      });

      it('formats the data', function () {
        var dashboard = new Dashboard('test-dashboard');

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {
            moduleData.data[0].should.eql({
              _quarter_start_at: '2013-07-01T00:00:00+00:00',
              _timestamp: '2013-07-01T00:00:00+00:00',
              end_at: '2014-07-01T00:00:00+00:00',
              formatted_change_from_previous: {
                change: '−50.00%',
                trend: 'decrease'
              },
              formatted_date_range: '1 July 2013 to 30 June 2014',
              formatted_value: '1',
              specific_data: 1,
              formatted_end_at: '30 June 2014',
              formatted_start_at: '1 July 2013'
            });
          });
      });
    });

    describe('module axes', function () {
      it('should return with axes data for the KPI module', function () {
        var dashboard = new Dashboard('test-dashboard');

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {
            moduleData.axes.x.should.eql({
              'label': 'Quarter',
              'key': ['_quarter_start_at', 'end_at'],
              'format': 'date'
            });

            moduleData.axes.y.should.eql([{
              label: 'test',
              key: 'specific_data',
              format: {
                type: 'number'
              }
            }]);
          });
      });

      it('should return with axes data for the SINLE_TIMESERIES module', function () {
        var dashboard = new Dashboard('test-dashboard');

        module.axes = {
          x: {
            label: 'Date',
            key: ['_start_at', '_end_at'],
            format: 'date'
          }
        };
        module['module-type'] = 'single_timeseries';
        module['format-options'] = {
          'type': 'number'
        };

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {

            moduleData.axes.x.should.eql({
              'label': 'Date',
              'key': ['_start_at', '_end_at'],
              'format': 'date'
            });

            moduleData.axes.y.should.eql([{
              key: 'specific_data',
              format: {
                type: 'number'
              }
            }]);
          });
      });

      it('should assume axis unit is integer if not specified', function () {
        var dashboard = new Dashboard('test-dashboard');
        module.axes = {
          'y': [{
            'label': 'User satisfaction',
            'key': 'satisfaction:sum',
            'format': 'percent'
          }, {'key': 'respondents', 'label': 'Number of respondents'}],
          'x': {'label': 'Date', 'key': ['_start_at', '_end_at'], 'format': 'date'}
        };
        module['module-type'] = 'single_timeseries';

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {
            moduleData.axes.y.should.eql([{
              'label': 'User satisfaction',
              'key': 'specific_data',
              'format': 'percent'
            },
              {
                'key': 'respondents',
                'label': 'Number of respondents',
                'format': {
                  type: 'integer'
                }
              }]);
          });
      });

      it('should return with axes data for the REALTIME module', function () {
        var dashboard = new Dashboard('test-dashboard');

        module['module-type'] = 'realtime';

        deferred.resolve({
          data: moduleDataResponse
        });

        return dashboard.getModule(module)
          .then(function (moduleData) {

            moduleData.axes.x.should.eql({
              'label': 'Time',
              'key': '_timestamp',
              'format': 'time'
            });

            moduleData.axes.y.should.eql([{
              key: 'unique_visitors',
              format: 'integer',
              label: 'Number of unique visitors'
            }]);
          });
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

  describe('Data sorting', function () {

    beforeEach(function (done) {

      var singleTimeSeriesModule = {
          'info': ['Data source: Google Analytics'],
          'value-attribute': 'avgSessionDuration:sum',
          'description': 'The mean length of time taken for users to complete an application.',
          'module-type': 'single_timeseries',
          'title': 'Time taken to complete transaction',
          'axes': {
            'y': [{'label': 'Average session time'}],
            'x': {'label': 'Date', 'key': ['_start_at', '_end_at'], 'format': 'date'}
          },
          'format-options': {'type': 'duration', 'unit': 'm'},
          'slug': 'time-taken-to-complete-transaction',
          'data-source': {
            'data-group': 'carers-allowance',
            'data-type': 'time-taken-to-complete',
            'query-params': {
              'duration': 52,
              'collect': ['avgSessionDuration:sum'],
              'group_by': 'stage',
              'period': 'week',
              'filter_by': ['stage:thank-you']
            }
          }
        },
        singleTimeSeriesData = [
          {
            '_count': 0,
            '_end_at': '2013-12-23T00:00:00+00:00',
            '_start_at': '2013-12-16T00:00:00+00:00',
            'avgSessionDuration:sum': null,
            'stage': 'thank-you'
          },
          {
            '_count': 0,
            '_end_at': '2013-12-30T00:00:00+00:00',
            '_start_at': '2013-12-23T00:00:00+00:00',
            'avgSessionDuration:sum': null,
            'stage': 'thank-you'
          }
        ];

      var dashboard = new Dashboard('test-dashboard');

      dashboard.getModule(singleTimeSeriesModule)
        .then(_.bind(function (moduleData) {
          this.moduleData = moduleData;
          done();
        }, this));
      deferred.resolve({
        data: singleTimeSeriesData
      });

    });

    it('sorts the data by date (descending) if necessary', function () {
      this.moduleData.data[0]._end_at.should.equal('2013-12-30T00:00:00+00:00');
      this.moduleData.data[1]._end_at.should.equal('2013-12-23T00:00:00+00:00');
    });

  });


  describe('Patch querystring', function () {

    var singleTimeSeriesModule;

    beforeEach(function () {

      singleTimeSeriesModule = _.clone({
        'info': ['Data source: Google Analytics'],
        'value-attribute': 'users:sum',
        'matching-attribute': 'dataType',
        'description': 'Total number of unique site visits per week',
        'module-type': 'single_timeseries',
        'title': 'Site traffic',
        'axes': {'y': [{'label': 'Number of visitors'}], 'x': {'label': 'Date'}},
        'axis-period': 'week',
        'slug': 'site-traffic',
        'data-source': {
          'data-group': 'student-finance',
          'data-type': 'site-traffic',
          'query-params': {'collect': ['users:sum'], 'group_by': 'dataType', 'period': 'week'}
        }
      });

      this.dashboard = new Dashboard('test-dashboard');

    });

    it('adds a duration if period is present', function () {
      deferred.resolve({
        data: moduleDataResponse
      });
      return this.dashboard.getModule(singleTimeSeriesModule)
        .then(function (moduleData) {
          var qs = stub.args[0][0].qs;
          qs.duration.should.equal(9);
          moduleData.data.length.should.equal(3);
        });
    });

    it('limits results to 2 if period is not present', function () {
      deferred.resolve({
        data: moduleDataResponse
      });
      delete singleTimeSeriesModule['data-source']['query-params'].period;
      return this.dashboard.getModule(singleTimeSeriesModule)
        .then(function () {
          var qs = stub.args[0][0].qs;
          qs.limit.should.equal(2);
        });
    });

  });

});
