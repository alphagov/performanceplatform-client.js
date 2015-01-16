var Delta = require('../../lib/views/Delta');

var moduleData = {
  moduleConfig: {
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
  },
  dataSource: {
    data: [
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
  axes: {
    'x': {
      'label': 'Quarter',
      'key': ['_quarter_start_at', 'end_at'],
      'format': 'date'
    },
    'y': [{
      'label': 'test',
      'key': 'specific_data',
      'format': {
        'type': 'number'
      }
    }]
  }
};

describe('Delta', function () {

  var delta;

  describe('init', function () {

    beforeEach(function () {
      sinon.stub(Delta.prototype, 'createDeltas');
      delta = new Delta(moduleData);
    });

    afterEach(function () {
      Delta.prototype.createDeltas.restore();
    });

    it('should set config, data and axes from the module', function () {
      delta.moduleConfig.should.eql(moduleData.moduleConfig);
      delta.data.should.eql(moduleData.dataSource.data);
      delta.axes.should.eql(moduleData.axes);
    });

    it('should call createDeltas()', function () {
      Delta.prototype.createDeltas.should.have.been.called;
    });

  });

  describe('createDeltas()', function () {

    var delta;

    beforeEach(function () {
      delta = new Delta(moduleData);
    });

    it('should add extra formatting keys', function () {
      delta.data[0].should.have.keys(
        [
          'formatted_value',
          'period',
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

    it('should only add a delta key if theres a previous model', function () {
      delta.data[2].should.have.keys(
        [
          'formatted_value',
          'period',
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

    it('should not add a delta key if the data format is not currency, number or duration',
      function () {
        moduleData.moduleConfig.format.type = 'text';
        delta = new Delta(moduleData);

        delta.data[2].should.have.keys(
          [
            'formatted_value',
            'period',
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

    it('adds a period key if one is available in the query-params', function () {
      moduleData.moduleConfig['data-source'] = {
        'query-params': {
          period: 'a year'
        }
      };
      delta = new Delta(moduleData);

      delta.data[0].period.should.equal('year');
    });

    it('formats the data', function () {
      delta.data[0].should.eql({
        _quarter_start_at: '2013-07-01T00:00:00+00:00',
        _timestamp: '2013-07-01T00:00:00+00:00',
        end_at: '2014-07-01T00:00:00+00:00',
        formatted_change_from_previous: {
          change: '−50.00%',
          trend: 'decrease'
        },
        formatted_date_range: '1 July 2013 to 30 June 2014',
        formatted_value: 1,
        period: 'year',
        specific_data: 1,
        formatted_end_at: '30 June 2014',
        formatted_start_at: '1 July 2013'
      });
    });


    describe('Data sorting', function () {

      it('sorts the data by date (descending) if necessary', function () {
        moduleData.moduleConfig = {
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
        };
        moduleData.dataSource.data = [
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
        delta = new Delta(moduleData);

        delta.data[0]._end_at.should.equal('2013-12-30T00:00:00+00:00');
        delta.data[1]._end_at.should.equal('2013-12-23T00:00:00+00:00');
      });

    });
  });

  describe('period calculation', function () {

    it('sets period key', function () {
      moduleData = {
        'moduleConfig': {
          'info': ['Datasource: Ministry of Justice'],
          'value-attribute': 'date_sla',
          'description': '',
          'module-type': 'kpi',
          'format': {'sigfigs': 3, 'magnitude': true, 'type': 'number'},
          'axes': {'x': {'format': 'date', 'key': ['_month_start_at', 'end_at'], 'label': 'Date'}},
          'modules': [],
          'classes': 'cols3',
          'title': 'Days to process 85% of applications',
          'slug': 'days-to-process-85-percent-of-applications',
          'data-source': {
            'data-group': 'legal-aid',
            'data-type': 'processing-target-metrics',
            'query-params': {
              'sort_by': '_timestamp:descending',
              'filter_by': ['service:legal-aid-civil-claims', 'transaction:applications'],
              'flatten': true,
              'limit': 2
            }
          }
        },
        'dataSource': {
          'options': {
            'json': true,
            'backdrop': 'https://www.performance.service.gov.uk/',
            'url': 'https://www.performance.service.gov.uk/data/legal-aid/processing-target-met'
          },
          'data': [{
            '_day_start_at': '2014-11-01T00:00:00+00:00',
            '_hour_start_at': '2014-11-01T00:00:00+00:00',
            '_id': 'MjAxNC0xMS0wMVQwMDowMDowMFoubW9udGguM',
            '_month_start_at': '2014-11-01T00:00:00+00:00',
            '_quarter_start_at': '2014-10-01T00:00:00+00:00',
            '_timestamp': '2014-11-01T00:00:00+00:00',
            '_updated_at': '2015-01-06T09:19:58.207000+00:00',
            '_week_start_at': '2014-10-27T00:00:00+00:00',
            '_year_start_at': '2014-01-01T00:00:00+00:00',
            'date_sla': 13,
            'end_at': '2014-12-01T00:00:00Z',
            'period': 'month',
            'service': 'legal-aid-civil-claims',
            'transaction': 'applications',
            'volume_sla': 0.97
          }, {
            '_day_start_at': '2014-10-01T00:00:00+00:00',
            '_hour_start_at': '2014-10-01T00:00:00+00:00',
            '_id': 'MjAxNC0xMC0wMVQwMDowMDowMFoubW9udGguMjAxNC0xMS',
            '_month_start_at': '2014-10-01T00:00:00+00:00',
            '_quarter_start_at': '2014-10-01T00:00:00+00:00',
            '_timestamp': '2014-10-01T00:00:00+00:00',
            '_updated_at': '2015-01-06T09:19:58.201000+00:00',
            '_week_start_at': '2014-09-29T00:00:00+00:00',
            '_year_start_at': '2014-01-01T00:00:00+00:00',
            'date_sla': 12,
            'end_at': '2014-11-01T00:00:00Z',
            'period': 'month',
            'service': 'legal-aid-civil-claims',
            'transaction': 'applications',
            'volume_sla': 0.97
          }]
        },
        'axes': {
          'x': {'label': 'Date', 'key': ['_month_start_at', 'end_at'], 'format': 'date'},
          'y': [{
            'label': 'Days to process 85% of applications',
            'key': 'date_sla',
            'format': {'sigfigs': 3, 'magnitude': true, 'type': 'number'}
          }]
        }
      };
      delta = new Delta(moduleData);
      delta.data[0].period.should.equal('month');
    });
  });
});
