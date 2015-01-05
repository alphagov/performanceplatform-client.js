var _ = require('lodash'),
  Datasource = require('./Datasource');

function Module (moduleConfig) {
  this.moduleConfig = moduleConfig || {};

  this.dataSource = new Datasource(this.moduleConfig['data-source']);
  this.axes = getModuleAxes(this.moduleConfig);
}

Module.prototype.getData = function () {
  return this.dataSource.getData();
};

Module.prototype.resolve = function () {
  return this.getData().then(_.bind(function (dataSource) {
    _.extend(this.dataSource, dataSource);
    return this;
  }, this));
};

module.exports = Module;

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
