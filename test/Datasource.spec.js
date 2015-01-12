var requireSubvert = require('require-subvert')(__dirname),
    Q = require('q');

describe('Datasource', function () {
  var Datasource,
      dataSource,
      dataSourceConfig,
      dataSourceResponse,
      deferred,
      stub;

  beforeEach(function () {
    deferred = Q.defer();
    stub = sinon.stub().returns(deferred.promise);
    requireSubvert.subvert('../lib/request-promise', stub);
    Datasource = requireSubvert.require('../lib/Datasource');

    dataSourceConfig = {
      'data-group': 'transactional-services',
      'data-type': 'summaries',
      'query-params': {
        'sort_by': '_timestamp:descending',
        'filter_by': [
          'service_id:bis-accounts-filing',
          'type:seasonally-adjusted'
        ]
      }
    };

    dataSourceResponse = [
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

    dataSource = new Datasource(dataSourceConfig);
  });

  describe('init', function () {

    it('sets the qs options from the config', function () {
      dataSource.options.should.eql({
        json: true,
        qs: {
          filter_by: [
            'service_id:bis-accounts-filing',
            'type:seasonally-adjusted'
          ],
          flatten: true,
          limit: 2,
          sort_by: '_timestamp:descending'
        },
        url: 'https://www.performance.service.gov.uk/data/transactional-services/summaries',
        backdrop: 'https://www.performance.service.gov.uk/'
      });
    });

    it('allows optional options', function () {
      dataSource = new Datasource(dataSourceConfig, {
        backdrop: 'test.com'
      });

      dataSource.options.backdrop.should.equal('test.com');
    });

    describe('querystring', function () {

      it('adds a duration if period is present', function () {
        dataSourceConfig = {
          'data-group': 'student-finance',
          'data-type': 'site-traffic',
          'query-params': {
            'collect': ['users:sum'],
            'group_by': 'dataType',
            'period': 'week'
          }
        };

        dataSource = new Datasource(dataSourceConfig);

        dataSource.options.qs.duration.should.equal(9);
      });

      it('limits results to 2 if period is not present', function () {
        dataSourceConfig = {
          'data-group': 'student-finance',
          'data-type': 'site-traffic',
          'query-params': {
            'collect': ['users:sum'],
            'group_by': 'dataType'
          }
        };

        dataSource = new Datasource(dataSourceConfig);

        dataSource.options.qs.limit.should.equal(2);
      });

    });

  });

  describe('getData', function () {

    it('should respond with the data from the endpoint', function () {
      deferred.resolve({
        data: dataSourceResponse
      });

      return dataSource.getData()
        .then(function (dataResponse) {
          dataResponse.data.should.eql(dataSourceResponse);
        });
    });

  });

});
