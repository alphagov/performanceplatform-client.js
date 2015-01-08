var presentation = require('../lib/presentation');
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

describe('presentation helpers', function () {

  describe('tabularData()', function () {

    it('should respond with tabular data for the module', function () {
      var tabularData = presentation.tabularData(moduleData);

      tabularData.should.eql([
        [
          'Quarter',
          '1 July 2013 to 30 June 2014',
          '1 April 2013 to 30 June 2014',
          '1 January 2013 to 30 June 2014'
        ],
        [
          'test',
          1,
          2,
          1
        ]
      ]);
    });

  });

  describe('formatKeys()', function () {

    it('should add extra formatting keys', function () {
      var formatKeys = presentation.formatKeys(moduleData);

      formatKeys[0].should.have.keys(
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
      var formatKeys = presentation.formatKeys(moduleData);

      formatKeys[2].should.have.keys(
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
        var formatKeys = presentation.formatKeys(moduleData);

        formatKeys[2].should.have.keys(
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

      var formatKeys = presentation.formatKeys(moduleData);

      formatKeys[0].period.should.equal('year');
    });

    it('formats the data', function () {
      var formatKeys = presentation.formatKeys(moduleData);

      formatKeys[0].should.eql({
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

        var formatKeys = presentation.formatKeys(moduleData);

        formatKeys[0]._end_at.should.equal('2013-12-30T00:00:00+00:00');
        formatKeys[1]._end_at.should.equal('2013-12-23T00:00:00+00:00');
      });

    });
  });

});
