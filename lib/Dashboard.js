var rp = require('./request-promise'),
  config = require('../config'),
  _ = require('lodash'),
  Q = require('q');

var Module = require('./Module');

function Dashboard (slug) {
  this.options = {
    json: true,
    slug: slug
  };
}

Dashboard.prototype.getConfig = function () {
  var options = _.extend(this.options, {
    url: config.stagecraft + 'public/dashboards?slug=' + this.options.slug
  });

  return rp(options);
};

Dashboard.prototype.resolve = function () {
  var moduleList = [];
  return this.getConfig()
    .then(_.bind(function (dashboard) {
      this.dashboard = dashboard;
      _.each(dashboard.modules, function (module) {
        moduleList.push(this.getModule(module));
      }, this);

      return Q.allSettled(moduleList);
    }, this))
    .then(_.bind(function (results) {
      var dashboardAndMetrics = _.extend({}, this.dashboard);
      dashboardAndMetrics.modules = [];

      _.each(results, function (result) {
        if (result.state === 'fulfilled') {
          dashboardAndMetrics.modules.push(result.value);
        }
      }, this);

      return dashboardAndMetrics;
    }, this));
};

Dashboard.prototype.getModule = function (module) {
  var newMod = new Module(module);

  return newMod.resolve();
};

module.exports = Dashboard;
