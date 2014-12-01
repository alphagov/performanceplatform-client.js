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
      return module;
    });
};

module.exports = Dashboard;
