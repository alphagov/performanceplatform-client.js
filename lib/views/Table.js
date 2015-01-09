var formatter = require('../utils/formatter'),
  _ = require('lodash');

function Table (module) {
  this.moduleConfig = module.moduleConfig;
  this.data = module.dataSource.data;
  this.axes = module.axes;

  this.tabularise();
}

Table.prototype.render = function () {
  var output = [];
  _.each(this.data, function (dataCol, colIndex) {
    if (colIndex === 0) {
      output.push(dataCol);
    } else {
      var col = [];
      _.each(dataCol, function (dataEntry, index) {
        if (index === 0) {
          col.push(dataEntry);
        } else {
          var yAxis = this.axes.y[colIndex - 1];
          col.push(formatter.format(dataEntry,
            yAxis.format));
        }
      }, this);
      output.push(col);
    }
  }, this);
  return output;
};

Table.prototype.tabularise = function () {
  var cols = [];
  var xAxisKeyIsArray = _.isArray(this.axes.x.key);
  var xAxisKey = xAxisKeyIsArray ? this.axes.x.key[0] : this.axes.x.key;
  var needsTotals = false;

  var groupedData = _.groupBy(this.data, xAxisKey);

  var xCol = [this.axes.x.label];
  _.each(groupedData, function (items, key) {
    if (xAxisKeyIsArray) {
      xCol.push(formatter.format(getRangeFromKeys(items[0], this.axes.x.key), this.axes.x.format));
    } else {
      xCol.push(formatter.format(key, this.axes.x.format));
    }
  }, this);

  cols.push(xCol);

  _.each(this.axes.y, function (yAxis) {
    var yCol = [];
    yCol.push(yAxis.label);
    _.each(groupedData, function (items) {
      if (yAxis.hasOwnProperty('groupId')) {
        needsTotals = true;
        //grouped_timeseries
        var groupBy = this.moduleConfig['data-source']['query-params'].group_by;
        var item = _.where(items, function (item) {
          return item[groupBy] === yAxis.groupId;
        })[0][this.moduleConfig['value-attribute']];
        yCol.push(item);
      } else {
        //everything else
        yCol.push(items[0][yAxis.key]);
      }
    }, this);

    cols.push(yCol);
  }, this);

  this.data = cols;

  if (needsTotals) {
    this.calculateTotals();
  }
};

function getRangeFromKeys (model, keys) {
  var dataRange = [];

  _.each(keys, function (key) {
    dataRange.push(model[key]);
  });

  return dataRange;
}

Table.prototype.calculateTotals = function () {
  var totals = ['Totals'];

  _.each(this.data, function (dataCol, index) {
    if (index > 0) {
      _.each(dataCol, function (value, colIndex) {
        if (colIndex > 0) {
          if (totals[colIndex]) {
            totals[colIndex] += value;
          } else {
            totals[colIndex] = value;
          }
        }
      });
    }
  });

  this.data.push(totals);
  var yAxis = {
    label: 'Totals',
    format: this.axes.y[0].format
  };
  this.axes.y.push(yAxis);
};

module.exports = Table;
