var formatter = require('../utils/formatter'),
  _ = require('lodash'),
  View = require('./View'),
  util = require('util');

function Table () {
  this.initialize.apply(this, arguments);
}

util.inherits(Table, View);

Table.prototype.initialize = function (module, options) {
  View.prototype.initialize.apply(this, arguments);
  this.options = _.extend({
    colsLimit: false,
    rowsLimit: false
  }, options);
  this.tabularise();
};

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
  var needsTotals = false;
  var yAxes = this.axes.y;
  var xCol = [this.axes.x.label];

  _.each(yAxes, function (yAxis, index) {
    var yCol = [];
    var groupId = yAxis.groupId;
    var data = this.data;
    var valueAttr = yAxis.key || this.moduleConfig['value-attribute'];

    yCol.push(yAxis.label);

    if (groupId) {
      data = this.data[groupId];
      needsTotals = true;
    }

    if (this.options.colsLimit && index >= this.options.colsLimit) {
      needsTotals = false;
      return;
    }

    _.each(data, function (item, itemNo) {
      if (this.options.rowsLimit && itemNo >= this.options.rowsLimit) {
        return;
      }
      //we only need the date column rendering once so do it before the first yAxis
      if (index === 0) {
        if (xAxisKeyIsArray) {
          xCol.push(formatter.format(getRangeFromKeys(item, this.axes.x.key), this.axes.x.format));
        } else {
          xCol.push(formatter.format(item[this.axes.x.key], this.axes.x.format));
        }
      }

      if (groupId) {
        yCol.push(item[valueAttr]);
      } else {
        yCol.push(item[valueAttr]);
      }
    }, this);

    // insert the xCol before we insert any y cols
    if (index === 0) {
      cols.push(xCol);
    }
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
