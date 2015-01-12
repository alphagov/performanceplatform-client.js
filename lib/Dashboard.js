var rp = require('./request-promise'),
  config = require('../config'),
  _ = require('lodash'),
  Q = require('q');

var Module = require('./Module');

function Dashboard (slug, options) {
  this.options =_.extend({
    json: true,
    slug: slug,
    stagecraft: config.stagecraft,
    backdrop: config.backdrop
  }, options);
}

Dashboard.prototype.getConfig = function () {
  var options = _.extend(this.options, {
    url: this.options.stagecraft + 'public/dashboards?slug=' + this.options.slug
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
  var newMod = new Module(module, {backdrop: this.options.backdrop});

  return newMod.resolve();
};

module.exports = Dashboard;
