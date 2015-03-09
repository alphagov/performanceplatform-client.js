var formatter = require('../utils/formatter'),
  moment = require('moment-timezone'),
  _ = require('lodash');

require('../utils/date-functions');

function Delta (module) {
  this.moduleConfig = module.moduleConfig;
  this.data = module.dataSource.data;
  this.axes = module.axes;

  this.createDeltas();
}

Delta.prototype.canCalculateDelta = function (yAxes) {
  return _.some(yAxes, function (y) {
    return (y.format && y.format.type &&
      (y.format.type === 'percent' ||
      y.format.type === 'integer' ||
      y.format.type === 'number' ||
      y.format.type === 'currency' ||
      y.format.type === 'duration'));
  });
};

Delta.prototype.createDeltas = function () {
  this.formating = this.moduleConfig.format || this.moduleConfig['format-options'];

  var yAxes = this.axes.y;
  var valueAttr = this.axes.y[0].key;
  var canCalculateDelta = this.canCalculateDelta(yAxes);


  if (this.moduleConfig['module-type'] === 'user_satisfaction_graph') {
    this.formating = {
      type: 'percent'
    };
    canCalculateDelta = true;
  }
  var period;

  if ((this.moduleConfig['data-source'] && this.moduleConfig['data-source']['query-params']) &&
    this.moduleConfig['data-source']['query-params'].period) {
    this.data.reverse();

    period = this.moduleConfig['data-source']['query-params'].period;
  }


  _.each(this.data, function (dataItem, index) {
    var currentValue = dataItem[valueAttr];
    var previousItem = this.data[index + 1] || undefined;
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
      dataItem.formatted_value = formatter.format(currentValue, this.formating);
    }

    //formatted_date_range
    formatDateRange(this.axes, dataItem);
  }, this);
};

function formatDateRange (axes, dataItem) {
  if (_.isArray(axes.x.key)) {
    dataItem.formatted_date_range =
      formatter.format(getRangeFromKeys(dataItem, axes.x.key), 'date');
    dataItem.formatted_start_at = formatter.format(dataItem[axes.x.key[0]], 'date');
    dataItem.formatted_end_at = formatter.format(dataItem[axes.x.key[1]], {
      type: 'date',
      subtract: 'day'
    });

    dataItem.period = moment.duration(moment(dataItem[axes.x.key[1]])
      .diff(moment(dataItem[axes.x.key[0]]))).humanize().replace('a ', '');
  } else {
    dataItem.formatted_start_at = formatter.format(dataItem[axes.x.key], 'date');

    if (dataItem['_end_at']) {
      dataItem.formatted_end_at = formatter.format(dataItem['_end_at'], {
        type: 'date',
        subtract: 'day'
      });
    }

    dataItem.period = moment.duration(moment(dataItem['_end_at'])
      .diff(moment(dataItem[axes.x.key]))).humanize();
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

module.exports = Delta;
