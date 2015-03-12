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

Delta.prototype.createDeltas = function () {
  this.formating = this.moduleConfig.format || this.moduleConfig['format-options'];

  var yAxes = this.axes.y,
      reverseData = false,
      groupedData = false;

  if (this.moduleConfig['data-source'] && this.moduleConfig['data-source']['query-params']) {

    if (this.moduleConfig['data-source']['query-params'].period) {
      reverseData = true;
    }

    if (this.moduleConfig['data-source']['query-params'].group_by && yAxes.length > 1) {
      _.each(this.moduleConfig['data-source']['query-params'].group_by, function (group, index) {
        if (group) {
          if (index === 0) {
            this.data = _.groupBy(this.data, group);
          } else {
            var newData = {};
            _.each(this.data, function (dataGroup, groupKey) {
              var tmpGroup = _.groupBy(dataGroup, group);
              _.each(tmpGroup, function (dataSubgroup, subgroupKey) {
                newData[groupKey + ':' + subgroupKey] = dataSubgroup;
              });
            });
            this.data = newData;
          }
          groupedData = true;
        }
      }, this);
    }
  }

  var calculateDelta = canCalculateDelta(yAxes);

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

    if (groupedData) {
      data = this.data[groupId];
      calculateDelta = true;
    } else {
      data = this.data;
    }

    if (reverseData) {
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
