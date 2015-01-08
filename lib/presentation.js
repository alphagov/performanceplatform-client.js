var formatter = require('./utils/formatter'),
  moment = require('moment-timezone'),
  _ = require('lodash');

require('./utils/date-functions');

module.exports.formatKeys = formatKeys;
module.exports.tabularData = tabularData;

function formatKeys (module) {
  var dataList = module.dataSource.data;
  var formating = module.moduleConfig.format || module.moduleConfig['format-options'];
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


  if (module.moduleConfig['module-type'] === 'user_satisfaction_graph') {
    formating = {
      type: 'percent'
    };
    canCalculateDelta = true;
  }
  var period;

  if ((module.moduleConfig['data-source'] && module.moduleConfig['data-source']['query-params']) &&
    module.moduleConfig['data-source']['query-params'].period) {
    dataList.reverse();

    period = module.moduleConfig['data-source']['query-params'].period;
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

  return dataList;
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
      .diff(moment(dataItem[module.axes.x.key[0]]))).humanize().replace('a ', '');
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
  var data = module.dataSource.data;
  var axes = module.axes;

  var cols = [];
  var xCol = [axes.x.label];

  xCol = applyKeyAndFormatToData(data, axes.x.key, axes.x.format, xCol);
  cols.push(xCol);

  _.each(axes.y, function (yAxis) {
    var yCol = [yAxis.label];

    yCol =
      applyKeyAndFormatToData(data, yAxis.key, module.format ||
        module.dataSource['format-options'], yCol);

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
