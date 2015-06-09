var Module = require('../lib/Module'),
    Datasource = require('../lib/Datasource'),
    Q = require('q');

describe('Module', function () {
  var mod,
      moduleConfig,
      moduleData,
      deferred;

  beforeEach(function () {
    moduleConfig = {
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

    moduleData = [
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

    sinon.spy(Datasource);

    mod = new Module(moduleConfig);

    deferred = Q.defer();

    sinon.stub(Datasource.prototype, 'getData').returns(deferred.promise);
  });

  afterEach(function () {
    Datasource.prototype.getData.restore();
  });

  describe('init', function () {

    it('sets the moduleConfig to the moduleConfig property', function () {
      mod.moduleConfig.should.eql(moduleConfig);
    });

    describe('module axes', function () {

      it('should return with axes data for the KPI module', function () {
        mod.axes.x.should.eql({
          'label': 'Quarter',
          'key': ['_quarter_start_at', 'end_at'],
          'format': 'date'
        });

        mod.axes.y.should.eql([{
          label: 'test',
          key: 'specific_data',
          format: {
            type: 'number'
          }
        }]);
      });

      it('should return with axes data for the SINLE_TIMESERIES module', function () {
        moduleConfig.axes = {
          x: {
            label: 'Date',
            key: ['_start_at', '_end_at'],
            format: 'date'
          }
        };
        moduleConfig['module-type'] = 'single_timeseries';
        moduleConfig['format'] = {
          'type': 'number'
        };

        mod = new Module(moduleConfig);

        mod.axes.x.should.eql({
          'label': 'Date',
          'key': ['_start_at', '_end_at'],
          'format': 'date'
        });

        mod.axes.y.should.eql([{
          key: 'specific_data',
          format: {
            type: 'number'
          }
        }]);
      });

      it('should assume axis unit is integer if not specified', function () {
        delete moduleConfig.format;
        delete moduleConfig['value-attribute'];

        moduleConfig.axes = {
          'y': [{'key': 'respondents', 'label': 'Number of respondents'}],
          'x': {'label': 'Date', 'key': ['_start_at', '_end_at'], 'format': 'date'}
        };
        moduleConfig['module-type'] = 'single_timeseries';

        mod = new Module(moduleConfig);

        mod.axes.y.should.eql([
          {
            'key': 'respondents',
            'label': 'Number of respondents',
            'format': {
              'type': 'integer'
            }
          }
        ]);
      });

      it('should return with axes data for the REALTIME module', function () {
        moduleConfig['module-type'] = 'realtime';

        mod = new Module(moduleConfig);

        mod.axes.x.should.eql({
          'label': 'Time',
          'key': '_timestamp',
          'format': 'time'
        });

        mod.axes.y.should.eql([{
          key: 'unique_visitors',
          format: 'integer',
          label: 'Number of unique visitors'
        }]);
      });

      describe('BAR_CHART_WITH_NUMBER', function () {
        it('should return with axes data for the module (DEFAULTS)', function () {
          moduleConfig = {
            'title': 'test',
            'module-type': 'bar_chart_with_number'
          };
          mod = new Module(moduleConfig);

          mod.axes.x.should.eql({
            'format': 'date',
            'key': [
              '_quarter_start_at',
              'end_at'
            ],
            'label': 'Dates'
          });

          mod.axes.y.should.eql([{
            'format': {
              'magnitude': true,
              'pad': true,
              'sigfigs': 3,
              'type': 'integer'
            },
            'key': 'uniqueEvents:sum',
            'label': 'Number of applications'
          }]);
        });

      });

      it('should return axes data for the module when value-attribute is set', function () {
        moduleConfig = {
          'title': 'test',
          'module-type': 'bar_chart_with_number',
          'value-attribute': 'specific_data'
        };
        mod = new Module(moduleConfig);

        mod.axes.x.should.eql({
          'format': 'date',
          'key': [
            '_quarter_start_at',
            'end_at'
          ],
          'label': 'Dates'
        });

        mod.axes.y.should.eql([{
          'format': {
            'type': 'integer',
            'magnitude': true,
            'pad': true,
            'sigfigs': 3
          },
          'key': 'specific_data',
          'label': 'Number of applications'
        }]);

      });

      it('should return axes data for the module when format is set', function () {
        moduleConfig = {
          'title': 'test',
          'module-type': 'bar_chart_with_number',
          'format': { type: 'integer', magnitude: false }
        };
        mod = new Module(moduleConfig);

        mod.axes.x.should.eql({
          'format': 'date',
          'key': [
            '_quarter_start_at',
            'end_at'
          ],
          'label': 'Dates'
        });

        mod.axes.y.should.eql([{
          'format': {
            'type': 'integer',
            'magnitude': false
          },
          'key': 'uniqueEvents:sum',
          'label': 'Number of applications'
        }]);
      });
    });

  });

  describe('isSupported', function () {

    it('retuns true for supported modules', function () {
      mod.isSupported('realtime').should.equal(true);
      mod.isSupported('kpi').should.equal(true);
      mod.isSupported('single_timeseries').should.equal(true);
      mod.isSupported('user_satisfaction_graph').should.equal(true);
    });

    it('returns false for unsupported modules', function () {
      mod.isSupported('something_unsupported').should.equal(false);
    });

  });

  describe('getData', function () {

    it('sets a datasource for the module', function () {
      mod.getData();
      mod.dataSource.should.be.instanceOf(Datasource);
    });

    it('calls getData on the dataSource', function () {
      mod.getData();

      Datasource.prototype.getData.should.have.been.calledOnce;
    });

    it('sets the response to the dataSource property', function () {
      deferred.resolve({
        data: moduleData
      });


      return mod.getData().then(function () {
        mod.dataSource.data.should.equal(moduleData);
      });
    });

  });

  describe('resolve()', function () {

    it('gets the data for a module and sets it to the dataSource property', function () {
      deferred.resolve({
        data: moduleData
      });

      return mod.resolve()
        .then(function () {
          mod.dataSource.data.should.eql(moduleData);
        });
    });

    it('rejects the promise if the module is not supported (so cant resolve)', function () {

      mod.moduleConfig['module-type'] = 'something_unsupported';

      return mod.resolve().should.be.rejected;
    });

  });
});
