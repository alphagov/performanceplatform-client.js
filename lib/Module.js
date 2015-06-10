var _ = require('lodash'),
  Datasource = require('./Datasource'),
  Q = require('q'),
  config = require('../config');

function Module (moduleConfig, options) {
  this.moduleConfig = moduleConfig || {};
  this.options =_.extend({
    backdrop: {
      url: config.backdrop
    }
  }, options);

  if (this.isSupported(this.moduleConfig['module-type'])) {
    this.axes = getModuleAxes(this.moduleConfig);
  }
}

Module.prototype.supported = [
  'realtime',
  'kpi',
  'single_timeseries',
  'user_satisfaction_graph',
  'grouped_timeseries',
  'section',
  'table',
  'bar_chart_with_number'
];

Module.prototype.isSupported = function (moduleType) {
  return _.contains(this.supported, moduleType);
};

Module.prototype.getData = function () {
  this.dataSource = new Datasource(this.moduleConfig['data-source'], this.options.backdrop);
  return this.dataSource.getData().then(_.bind(function (dataSource) {
    _.extend(this.dataSource, dataSource);

    return this;
  }, this));
};

Module.prototype.resolve = function () {
  if (this.isSupported(this.moduleConfig['module-type'])) {
    if (this.moduleConfig['module-type'] === 'section') {
      return Q.resolve(this);
    } else if (this.moduleConfig['module-type'] !== 'user_satisfaction_graph') {
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

  switch (type) {
    case 'kpi': {
      return _.merge({
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
      }, module.axes);
    }

    case 'single_timeseries': {
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
            format: module['format'],
            key: module['value-attribute']
          }
        ]
      });
    }

    case 'realtime': {
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

    case 'grouped_timeseries': {
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

    case 'bar_chart_with_number': {
      var valueAttr = module['value-attribute'] || 'uniqueEvents:sum';
      var formatOptions = module['format'] ||
        { type: 'integer', magnitude: true, sigfigs: 3, pad: true };
      return _.merge({
        x: {
          label: 'Dates',
          key: ['_quarter_start_at', 'end_at'],
          format: 'date'
        },
        y: [
          {
            label: 'Number of applications',
            key: valueAttr,
            format: formatOptions
          }
        ]
      }, module.axes);
    }

    default : {
      return module.axes;
    }

  }

}
