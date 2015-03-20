var _ = require('lodash');

function View () {
  this.initialize.apply(this, arguments);
}

View.prototype.initialize = function (module) {
  this.moduleConfig = module.moduleConfig;
  this.data = module.dataSource.data;
  this.axes = module.axes;

  this.marshalData();
};

View.prototype.marshalData = function () {
  var yAxes = this.axes.y;

  this.reverseData = false;
  this.groupedData = false;

  if (this.moduleConfig['module-type'] !== 'grouped_timeseries') {
    //For a delta we're only interested in the first axis for everything but grouped_timeseries
    yAxes = [yAxes[0]];
  }

  if (this.moduleConfig['data-source'] && this.moduleConfig['data-source']['query-params']) {

    if (this.moduleConfig['data-source']['query-params'].period) {
      this.reverseData = true;
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
          this.groupedData = true;
        }
      }, this);
    }

    if (this.moduleConfig['show-total-lines']) {
      var valueAttr = this.moduleConfig['value-attribute'];
      //create a total grouping
      var groups = Object.keys(this.data);
      var totals = [];
      _.each(groups, function (group, index) {
        _.each(this.data[group], function (item, groupIndex) {
          if (index === 0) {
            totals.push(_.clone(item));
          } else {
            if (item[valueAttr]) {
              totals[groupIndex][valueAttr] += item[valueAttr];
            }
          }
        }, this);
      }, this);
      this.data.total = totals;
    }
  }
};

module.exports = View;