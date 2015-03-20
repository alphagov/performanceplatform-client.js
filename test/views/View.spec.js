var View = require('../../lib/views/View');
var groupedTimeSeriesData = require('../fixtures/module-config-grouped-time-series.json');
var groupedTimeSeriesDataMultipleGroupBy =
  require('../fixtures/module-config-grouped-time-series-multiple-group-by.json');
var _ = require('lodash');

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

describe('View', function () {

  var view;

  describe('initialize', function () {

    beforeEach(function () {
      sinon.stub(View.prototype, 'marshalData');
      view = new View(moduleData);
    });

    afterEach(function () {
      View.prototype.marshalData.restore();
    });

    it('should set config, data and axes from the module', function () {
      view.moduleConfig.should.eql(moduleData.moduleConfig);
      view.data.should.eql(moduleData.dataSource.data);
      view.axes.should.eql(moduleData.axes);
    });

    it('should call marshalData()', function () {
      View.prototype.marshalData.should.have.been.called;
    });

  });

  describe('marshalData()', function () {

    describe('groupedTimeseries', function () {

      beforeEach(function () {
        view = new View(_.cloneDeep(groupedTimeSeriesData));
      });

      it('should group the data with the group_by', function () {
        view.data.should.have.keys(['fully-digital', 'assisted-digital', 'manual']);
      });

      describe('groupedTimeseriesWithMultipleGroupBy', function () {

        beforeEach(function () {
          view = new View(_.cloneDeep(groupedTimeSeriesDataMultipleGroupBy));
        });

        it('should group the data with the group_by', function () {
          view.data.should.have.keys(
            [
              '2013/14:started',
              '2013/14:submitted',
              '2014/15:started',
              '2014/15:submitted',
              '2015/16:started',
              '2015/16:submitted'
            ]
          );
        });

      });

      describe('show-total-lines', function () {

        beforeEach(function () {
          var totalLines = _.cloneDeep(groupedTimeSeriesData);

          totalLines.moduleConfig['show-total-lines'] = true;
          totalLines.axes.y.push({
            'format': 'integer',
            'groupId': 'total',
            'label': 'Totals'
          });

          view = new View(totalLines);
        });

        it('will create a new total series', function () {
          view.data.should.have.keys(['fully-digital', 'assisted-digital', 'manual', 'total']);
        });

        it('will sum up all series into a total series', function () {
          view.data['fully-digital'][0]['volume:sum'].should.eql(1863942);
          view.data['assisted-digital'][0]['volume:sum'].should.eql(1306292);
          view.data['manual'][0]['volume:sum'].should.eql(13603);

          //sums the above together
          view.data['total'][0]['volume:sum'].should.eql(3183837);
        });

      });

    });

  });

});
