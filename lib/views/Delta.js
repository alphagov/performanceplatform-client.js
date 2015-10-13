var formatter = require('../utils/formatter'),
  moment = require('moment-timezone'),
  _ = require('lodash'),
  View = require('./View'),
  util = require('util');

require('../utils/date-functions');

function Delta (module) {
  this.initialize(module);
}

util.inherits(Delta, View);

Delta.prototype.initialize = function (module) {
  View.prototype.initialize.call(this, module);
  this.createDeltas();
};

Delta.prototype.createDeltas = function () {
  var yAxes = this.axes.y,
      calculateDelta = canCalculateDelta(yAxes);

  this.formating = this.moduleConfig.format || this.moduleConfig['format-options'] || {
    type: 'integer',
    magnitude: true,
    pad: true
  };

  if (this.moduleConfig['module-type'] !== 'grouped_timeseries') {
    //For a delta we're only interested in the first axis for everything but grouped_timeseries
    yAxes = [yAxes[0]];
  }

  if (this.moduleConfig['module-type'] === 'user_satisfaction_graph') {
    this.formating = {
      type: 'percent'
    };
    calculateDelta = true;
  }

  _.each(yAxes, function (yAxis) {
    var valueAttr = yAxis.key || this.moduleConfig['value-attribute'];
    var groupId = yAxis.groupId;
    var data;

    if (this.groupedData) {
      data = this.data[groupId];
      calculateDelta = true;
    } else {
      data = this.data;
    }

    if (this.reverseData) {
      data.reverse();
    }

    _.each(data, function (dataItem, index) {
      var currentValue = dataItem[valueAttr];
      var previousItem = data[index + 1] || undefined;
      var previousValue = previousItem ? previousItem[valueAttr] : undefined;

      if (previousValue && calculateDelta) {
        formattedChange(currentValue, previousValue, dataItem);
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
  }, this);
};

function canCalculateDelta (yAxes) {
  return _.some(yAxes, function (y) {
    return (y.format && y.format.type &&
      (y.format.type === 'percent' ||
      y.format.type === 'integer' ||
      y.format.type === 'number' ||
      y.format.type === 'currency' ||
      y.format.type === 'duration'));
  });
}

function formattedChange (currentValue, previousValue, dataItem) {
  // formatted_change_from_previous
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

function formatDateRange (axes, dataItem) {
  var xAxisKeyIsArray = _.isArray(axes.x.key);
  var endAt = xAxisKeyIsArray ? axes.x.key[1] : '_end_at';
  var startAt = xAxisKeyIsArray ? axes.x.key[0] : axes.x.key;


  if (_.isArray(axes.x.key)) {
    dataItem.formatted_date_range =
      formatter.format(getRangeFromKeys(dataItem, axes.x.key), 'date');
    dataItem.formatted_start_at = formatter.format(dataItem[axes.x.key[0]], 'date');
    dataItem.formatted_end_at = formatter.format(dataItem[axes.x.key[1]], {
      type: 'date',
      subtract: 'day'
    });
  } else {
    dataItem.formatted_start_at = formatter.format(dataItem[axes.x.key], 'date');

    if (dataItem['_end_at']) {
      dataItem.formatted_end_at = formatter.format(dataItem['_end_at'], {
        type: 'date',
        subtract: 'day'
      });
    }
  }

  dataItem.period = moment.duration(moment(dataItem[endAt])
    .diff(moment(dataItem[startAt]))).humanize().replace('a ', '');

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
