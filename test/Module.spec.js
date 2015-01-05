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

    it('sets a datasource for the module', function () {
      mod.dataSource.should.be.instanceOf(Datasource);
    });

    it('sets a module axes', function () {
      mod.axes.should.eql({
        x: {
          format: 'date',
          key: [
            '_quarter_start_at',
            'end_at'
          ],
          label: 'Quarter'
        },
        y: [{
          format: {
            type: 'number'
          },
          key: 'specific_data',
          label: 'test'
        }]
      });
    });

  });

  describe('getData', function () {
    it('calls getData on the dataSource', function () {
      mod.getData();
      Datasource.prototype.getData.should.have.been.calledOnce;
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
  });
});
