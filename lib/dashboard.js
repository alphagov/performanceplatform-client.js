var rp = require('./request-promise'),
  config = require('../config'),
  _ = require('lodash'),
  Q = require('q'),
  formatter = require('./utils/formatter');
var moment = require('moment-timezone');
require('./utils/date-functions');

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
  var supportedModules = ['realtime', 'kpi', 'single_timeseries', 'user_satisfaction_graph'];
  return this.getConfig()
    .then(_.bind(function (dashboard) {
      this.dashboard = dashboard;
      _.each(dashboard.modules, function (module) {
        if (_.contains(supportedModules, module['module-type'])) {

          if (module['module-type'] !== 'user_satisfaction_graph') {
            moduleList.push(this.getModule(module));
          } else {
            if (module['data-source']['data-type'] === 'user-satisfaction-score') {
              moduleList.push(this.getModule(module));
            }
          }
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
    }, (module['data-source']['query-params']['period']) ? {} :
      {'sort_by': '_timestamp:descending'} )
  });
  options.qs = configureTimespans(options.qs);

  return rp(options)
    .then(function (data) {
      module.data = data.data;
      module.axes = getModuleAxes(module);
      module = formatKeys(module);
      module.tabularData = tabularData(module);
      return module;
    });
};

function configureTimespans (queryParams) {
  var PERIOD_TO_DURATION = {
      hour: 24,
      day: 30,
      week: 9,
      month: 12,
      quarter: 24
    },
    ISO_8601 = 'YYYY-MM-DD[T]HH:mm:ss[Z]';
  if (queryParams.start_at && !queryParams.end_at && !queryParams.duration) {
    queryParams.end_at = moment();
  } else if (queryParams.start_at && queryParams.end_at && queryParams.duration) {
    delete queryParams.duration;
  }
  if (queryParams.period && !queryParams.duration && !(queryParams.start_at &&
    queryParams.end_at)) {
    queryParams.duration =
      PERIOD_TO_DURATION[queryParams.period];
  }
  if (!queryParams.period) {
    queryParams.limit = 2;
  }
  _.each(['start_at', 'end_at'], function (prop) {
    if (queryParams[prop]) {
      queryParams[prop] = moment(queryParams[prop]).utc().format(ISO_8601);
    }
  });
  return queryParams;
}

function formatKeys (module) {
  var dataList = module.data;
  var formating = module.format || module['format-options'];
  var yAxes = module.axes.y;
  var valueAttr = module.axes.y[0].key;
  var canCalculateDelta = _.some(yAxes, function (y) {
    return (y.format && y.format.type &&
      (y.format.type === 'percent' ||
      y.format.type === 'integer' ||
      y.format.type === 'number' ||
      y.format.type === 'currency' ||
      y.format.type === 'duration'));
  });

  if (module['module-type'] === 'user_satisfaction_graph') {
    formating = {
      type: 'percent'
    };
    canCalculateDelta = true;
  }
  var period;

  if ((module['data-source'] && module['data-source']['query-params']) &&
    module['data-source']['query-params'].period) {
    dataList.reverse();

    period = module['data-source']['query-params'].period;
  }


  for (var x = 0; x < dataList.length; x++) {
    var dataItem = dataList[x];
    var currentValue = dataItem[valueAttr];
    var previousItem = dataList[x + 1] || undefined;
    var previousValue = previousItem ? previousItem[valueAttr] : undefined;

    // formatted_change_from_previous
    if (previousValue && canCalculateDelta) {
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

      if (currentValue !== 'no data') {
        dataItem.formatted_change_from_previous = {
          change: change,
          trend: trend
        };
      }
    }

    //formatted_value
    if (currentValue === null) {
      dataItem.formatted_value = 'no data';
    } else {
      dataItem.formatted_value = formatter.format(currentValue, formating);
    }

    //formatted_date_range
    formatDateRange(module, dataItem);
  }

  return module;
}

function formatDateRange (module, dataItem) {
  if (_.isArray(module.axes.x.key)) {
    dataItem.formatted_date_range =
      formatter.format(getRangeFromKeys(dataItem, module.axes.x.key), 'date');
    dataItem.formatted_start_at = formatter.format(dataItem[module.axes.x.key[0]], 'date');
    dataItem.formatted_end_at = formatter.format(dataItem[module.axes.x.key[1]], {
      type: 'date',
      subtract: 'day'
    });

    dataItem.period = moment.duration(moment(dataItem[module.axes.x.key[1]])
      .diff(moment(dataItem[module.axes.x.key[0]]))).humanize();
  } else {
    dataItem.formatted_start_at = formatter.format(dataItem[module.axes.x.key], 'date');

    if (dataItem['_end_at']) {
      dataItem.formatted_end_at = formatter.format(dataItem['_end_at'], {
        type: 'date',
        subtract: 'day'
      });
    }

    dataItem.period = moment.duration(moment(dataItem['_end_at'])
      .diff(moment(dataItem[module.axes.x.key]))).humanize();
  }
  return dataItem;
}

function getRangeFromKeys (model, keys) {
  var dataRange = [];

  _.each(keys, function (key) {
    dataRange.push(model[key]);
  });

  return dataRange;
}

function tabularData (module) {
  var data = module.data;
  var axes = module.axes;

  var cols = [];
  var xCol = [axes.x.label];

  xCol = applyKeyAndFormatToData(data, axes.x.key, axes.x.format, xCol);
  cols.push(xCol);

  _.each(axes.y, function (yAxis) {
    var yCol = [yAxis.label];

    yCol =
      applyKeyAndFormatToData(data, yAxis.key, module.format || module['format-options'], yCol);

    cols.push(yCol);
  });

  function applyKeyAndFormatToData (data, key, format, axis) {
    _.each(data, function (dataEntry) {
      // then it's always a date?
      if (_.isArray(key)) {
        axis.push(formatter.format(getRangeFromKeys(dataEntry, key), format));
      } else {
        axis.push(formatter.format(dataEntry[key], format));
      }
    });

    return axis;
  }

  return cols;
}

function getModuleAxes (module) {
  var type = module['module-type'];

  if (type === 'kpi') {
    return {
      x: {
        label: 'Quarter',
        key: ['_quarter_start_at', 'end_at'],
        format: 'date'
      },
      y: [
        {
          label: module.title,
          key: module['value-attribute'],
          format: module.format
        }
      ]
    };
  }

  else if (type === 'single_timeseries') {
    _.each(module.axes.y, function (axis) {
      if (!axis.format) {
        _.merge(axis, {
          format: {
            type: 'integer'
          }
        });
      }
    });
    return _.merge(module.axes, {
      y: [
        {
          format: module['format-options'],
          key: module['value-attribute']
        }
      ]
    });
  }

  else if (type === 'realtime') {
    return {
      x: {
        label: 'Time',
        key: '_timestamp',
        format: 'time'
      },
      y: [
        {
          label: 'Number of unique visitors',
          key: 'unique_visitors',
          format: 'integer'
        }
      ]
    };
  }

  else if (type === 'user_satisfaction_graph') {
    return module.axes;
  }

}

module.exports = Dashboard;
