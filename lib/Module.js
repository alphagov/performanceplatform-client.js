var _ = require('lodash'),
  Datasource = require('./Datasource'),
  Q = require('q');

function Module (moduleConfig, options) {
  this.moduleConfig = moduleConfig || {};

  if (this.isSupported(this.moduleConfig['module-type'])) {
    this.dataSource = new Datasource(this.moduleConfig['data-source'], options);
    this.axes = getModuleAxes(this.moduleConfig);
  }
}

Module.prototype.supported = [
  'realtime',
  'kpi',
  'single_timeseries',
  'user_satisfaction_graph',
  'grouped_timeseries'
];

Module.prototype.isSupported = function (moduleType) {
  return _.contains(this.supported, moduleType);
};

Module.prototype.getData = function () {
  return this.dataSource.getData().then(_.bind(function (dataSource) {
    _.extend(this.dataSource, dataSource);

    return this;
  }, this));
};

Module.prototype.resolve = function () {
  if (this.isSupported(this.moduleConfig['module-type'])) {
    if (this.moduleConfig['module-type'] !== 'user_satisfaction_graph') {
      return this.getData();
    } else {
      if (this.moduleConfig['data-source']['data-type'] === 'user-satisfaction-score') {
        return this.getData();
      } else {
        return Q.reject(this.moduleConfig['module-type'] + ' - Module not supported');
      }
    }
  } else {
    return Q.reject(this.moduleConfig['module-type'] + ' - Module not supported');
  }
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

  else if (type === 'grouped_timeseries') {
    return _.merge({
      x: {
        label: 'Date',
        key: '_start_at',
        format: {
          type: 'date',
          format: 'MMMM YYYY'
        }
      }
    }, module.axes);

  }

}
