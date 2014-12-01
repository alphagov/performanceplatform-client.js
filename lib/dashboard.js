var rp = require('./request-promise'),
    config = require('../config'),
    _ = require('underscore'),
    Q = require('q');

function Dashboard (slug) {
  this.options = {
    json: true,
    slug: slug,
    useQuerystring: true
  };
}

Dashboard.prototype.getConfig = function () {
  var options = _.extend(this.options, {
    url: config.stagecraft + 'public/dashboards?slug=' + this.options.slug
  });

  return rp(options);
};

Dashboard.prototype.getDashboardMetrics = function () {
  var kpiList = [];
  return this.getConfig()
    .then(_.bind(function (dashboard) {
      this.dashboard = dashboard;
      _.each(dashboard.modules, function (module) {
        if (module['module-type'] === 'kpi') {
          kpiList.push(this.getKPI(module));
        }
      }, this);

      return Q.allSettled(kpiList);
    }, this))
      .then(_.bind(function (results) {
        var dashboardAndMetrics = {};
        dashboardAndMetrics.title = this.dashboard.title;
        dashboardAndMetrics.modules = [];

        _.each(results, function (result) {
          if (result.state === 'fulfilled') {
            dashboardAndMetrics.modules.push(result.value);
          }
        }, this);

        return dashboardAndMetrics;
      }, this));
};

Dashboard.prototype.getKPI = function (module) {
  var dataSource = module['data-source'];
  var options = _.extend(this.options, {
    url: config.backdrop + 'data/' + dataSource['data-group'] + '/' + dataSource['data-type'],
    qs: dataSource['query-params']
  });

  return rp(options)
    .then(function (data) {
      module.data = data.data;
      module.axes = module.axes || getModuleAxes(module);
      module.tabularData = tabularData(module);
      return module;
    });
};

function tabularData (module) {
  var data = module.data;
  var axes = module.axes;

  var cols = [];
  var xCol = [axes.x.label];

  xCol = loopAndReturnFromKey(data, xCol, axes.x.key);
  cols.push(xCol);

  _.each(axes.y, function (yAxis) {
    var yCol = [yAxis.label];

    yCol = loopAndReturnFromKey(data, yCol, yAxis.key);

    cols.push(yCol);
  });

  function loopAndReturnFromKey (data, axis, key) {
    _.each(data, function (dataEntry) {
      axis.push(dataEntry[key]);
    });

    return axis;
  }

  return cols;
}

function getModuleAxes (module) {
  var type = module['module-type'];

  if (type === 'kpi') {
    return {
      'x': {
        'label': 'Quarter',
        'key': '_quarter_start_at',
        'format': 'date'
      },
      'y': [
        {
          'label': module.title,
          'key': module['value-attribute'],
          'format': module.format
        }
      ]
    };
  }
}

module.exports = Dashboard;
