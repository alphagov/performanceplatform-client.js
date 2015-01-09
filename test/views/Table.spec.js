var Table = require('../../lib/views/Table');
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

describe('Table View', function () {
  var table;

  describe('init', function () {

    beforeEach(function () {
      sinon.stub(Table.prototype, 'tabularise');
      table = new Table(moduleData);
    });

    afterEach(function () {
      Table.prototype.tabularise.restore();
    });

    it('should set config, data and axes from the module', function () {
      table.moduleConfig.should.eql(moduleData.moduleConfig);
      table.data.should.eql(moduleData.dataSource.data);
      table.axes.should.eql(moduleData.axes);
    });

    it('should call tabularise()', function () {
      Table.prototype.tabularise.should.have.been.called;
    });

  });

  describe('tabularise()', function () {

    beforeEach(function () {
      table = new Table(moduleData);
    });

    it('creates a tabular view of the data', function () {
      table.data.should.eql([
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

  describe('render()', function () {

    beforeEach(function () {
      table = new Table(moduleData);
    });

    it('formats the values', function () {
      table.render().should.eql([
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

  describe('grouped-timeseries', function () {

    beforeEach(function () {
      moduleData.moduleConfig = {
        'value-attribute': 'volume:sum',
        'module-type': 'grouped_timeseries',
        'data-source': {
          'data-group': 'vehicle-licensing',
          'data-type': 'volumetrics',
          'query-params': {
            collect: [ 'volume:sum' ],
            group_by: [ 'channel' ],
            period: 'month',
            filter_by: [ 'service:tax-disc' ],
            flatten: true,
            duration: 12
          }
        }
      };

      moduleData.dataSource.data = [
        {
          _count: 4,
          _end_at: '2014-02-01T00:00:00+00:00',
          _start_at: '2014-01-01T00:00:00+00:00',
          channel: 'manual',
          'volume:sum': 13603
        },
        {
          _count: 2,
          _end_at: '2014-02-01T00:00:00+00:00',
          _start_at: '2014-01-01T00:00:00+00:00',
          channel: 'assisted-digital',
          'volume:sum': 1306292
        },
        {
          _count: 4,
          _end_at: '2014-02-01T00:00:00+00:00',
          _start_at: '2014-01-01T00:00:00+00:00',
          channel: 'fully-digital',
          'volume:sum': 1863942
        },
        {
          _count: 4,
          _end_at: '2014-03-01T00:00:00+00:00',
          _start_at: '2014-02-01T00:00:00+00:00',
          channel: 'manual',
          'volume:sum': 12219
        },
        {
          _count: 2,
          _end_at: '2014-03-01T00:00:00+00:00',
          _start_at: '2014-02-01T00:00:00+00:00',
          channel: 'assisted-digital',
          'volume:sum': 1637752
        },
        {
          _count: 4,
          _end_at: '2014-03-01T00:00:00+00:00',
          _start_at: '2014-02-01T00:00:00+00:00',
          channel: 'fully-digital',
          'volume:sum': 2514166
        }
      ];

      moduleData.axes = {
        x: {
          label: 'Date',
          key: '_start_at',
          format: {
            type: 'date',
            format: 'MMMM YYYY'
          }
        },
        y: [
          {
            format: 'integer',
            groupId: 'fully-digital',
            label: 'Digital and automated phone'
          },
          {
            format: 'integer',
            groupId: 'assisted-digital',
            label: 'Post Office'
          },
          {
            format: 'integer',
            groupId: 'manual',
            label: 'DVLA centre'
          }
        ]
      };

      table = new Table(moduleData);
    });

    describe('tabularise()', function () {
      it('creates a tabular view of the data', function () {

        table.data.should.eql([
          [ 'Date', 'January 2014', 'February 2014' ],
          [ 'Digital and automated phone', 1863942, 2514166 ],
          [ 'Post Office', 1306292, 1637752 ],
          [ 'DVLA centre', 13603, 12219 ],
          [ 'Totals', 3183837, 4164137 ]
        ]);

      });
    });

    describe('render()', function () {
      it('formats the values', function () {
        table.render().should.eql([
          [ 'Date', 'January 2014', 'February 2014' ],
          [ 'Digital and automated phone', '1,863,942', '2,514,166' ],
          [ 'Post Office', '1,306,292', '1,637,752' ],
          [ 'DVLA centre', '13,603', '12,219' ],
          [ 'Totals', '3,183,837', '4,164,137' ]
        ]);
      });
    });

  });

});
