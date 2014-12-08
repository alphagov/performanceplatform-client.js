var rp = require('./request-promise'),
    config = require('../config'),
    _ = require('underscore'),
    Q = require('q'),
    formatter = require('./utils/formatter');

function Dashboard (slug) {
  this.options = {
    json: true,
    slug: slug
  };
}

Dashboard.prototype.getConfig = function () {
  var options = _.extend(this.options, {
    url: config.stagecraft + 'public/dashboards?slug=' + this.options.slug
  });

  return rp(options);
};

Dashboard.prototype.getDashboardMetrics = function () {
  var moduleList = [];
  var supportedModules = ['kpi', 'single_timeseries'];
  return this.getConfig()
    .then(_.bind(function (dashboard) {
      this.dashboard = dashboard;
      _.each(dashboard.modules, function (module) {
        if (_.contains(supportedModules, module['module-type'])) {
          moduleList.push(this.getModule(module));
        }
      }, this);

      return Q.allSettled(moduleList);
    }, this))
      .then(_.bind(function (results) {
        var dashboardAndMetrics = _.extend({}, this.dashboard);
        dashboardAndMetrics.modules = [];

        _.each(results, function (result) {
          if (result.state === 'fulfilled') {
            dashboardAndMetrics.modules.push(result.value);
          }
        }, this);

        return dashboardAndMetrics;
      }, this));
};

Dashboard.prototype.getModule = function (module) {
  var dataSource = module['data-source'];
  var options = _.extend(this.options, {
    url: config.backdrop + 'data/' + dataSource['data-group'] + '/' + dataSource['data-type'],
    qs: _.extend(dataSource['query-params'], {
      flatten: true
    })
  });

  return rp(options)
    .then(function (data) {
      module.data = data.data;
      module.axes = module.axes || getModuleAxes(module);
      module = formatKeys(module);
      module.tabularData = tabularData(module);
      return module;
    });
};

function formatKeys (module) {
  var dataList = module.data;
  var formating = module.format;
  var valueAttr = module['value-attribute'];
  var yAxes = module.axes.y;
  var isNumberOrCurrency = _.some(yAxes, function (y) {
    return y.format  === 'number' || y.format === 'currency';
  });

  for (var x = 0; x < dataList.length; x++) {
    var dataItem = dataList[x];
    var currentValue = dataItem[valueAttr];
    var previousItem = dataList[x + 1] || undefined;
    var previousValue = previousItem ? previousItem[valueAttr] : undefined;

    // formatted_change_from_previous
    if (previousValue && isNumberOrCurrency) {
      var change = formatter.format((currentValue - previousValue) / previousValue,
          {
            type: 'percent',
            dps: 2,
            pad: true,
            showSigns: true
          }
      );
      var trend;

      if (currentValue > previousValue) {
        trend = 'increase';
      } else if (currentValue < previousValue) {
        trend = 'decrease';
      } else {
        trend = 'no-change';
      }

      dataItem.formatted_change_from_previous = {
        change: change,
        trend: trend
      };
    }

    //formatted_value
    if (currentValue) {
      dataItem.formatted_value = formatter.format(currentValue, formating);
    } else if (currentValue === null) {
      dataItem.formatted_value = 'no data';
    }

    //formatted_start_at
    if (dataItem['_timestamp']) {
      dataItem.formatted_start_at = formatter.format(dataItem['_timestamp'], 'date');
    }

    //formatted_end_at
    if (dataItem['end_at']) {
      dataItem.formatted_end_at = formatter.format(dataItem['end_at'], 'date');
    }

    //formatted_date_range
    if (dataItem['_timestamp'] && dataItem['end_at']) {
      var range = [dataItem['_timestamp'], dataItem['end_at']];
      dataItem.formatted_date_range = formatter.format(range, 'date');
    }
  }

  return module;
}

function tabularData (module) {
  var data = module.data;
  var axes = module.axes;

  var cols = [];
  var xCol = [axes.x.label];

  xCol = loopAndReturnFromKey(data, xCol, axes.x.key);
  cols.push(xCol);

  _.each(axes.y, function (yAxis) {
    var yCol = [yAxis.label];

    yCol = loopAndReturnFromKey(data, yCol, yAxis.key);

    cols.push(yCol);
  });

  function loopAndReturnFromKey (data, axis, key) {
    _.each(data, function (dataEntry) {
      axis.push(dataEntry[key]);
    });

    return axis;
  }

  return cols;
}

function getModuleAxes (module) {
  var type = module['module-type'];

  if (type === 'kpi') {
    return {
      'x': {
        'label': 'Quarter',
        'key': '_quarter_start_at',
        'format': 'date'
      },
      'y': [
        {
          'label': module.title,
          'key': module['value-attribute'],
          'format': module.format.type
        }
      ]
    };
  }

}

module.exports = Dashboard;
