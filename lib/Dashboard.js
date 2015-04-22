var rp = require('./request-promise'),
  config = require('../config'),
  _ = require('lodash'),
  Q = require('q');

var Module = require('./Module');

function Dashboard (slug, options) {
  this.options =_.extend({
    json: true,
    slug: slug,
    stagecraft: {
      url: config.stagecraft
    },
    backdrop: {
      url: config.backdrop
    }
  }, options);
}

Dashboard.prototype.getConfig = function () {
  var options = _.extend(this.options, {
    url: this.options.stagecraft.url + 'public/dashboards?slug=' + this.options.slug
  });

  return rp(options);
};

Dashboard.prototype.resolve = function () {
  return this.getConfig()
    .then(_.bind(function (dashboard) {
      var moduleList = [];
      this.dashboard = dashboard;
      this.getModules(moduleList, dashboard.modules);
      return Q.allSettled(moduleList);
    }, this))
    .then(_.bind(function (results) {
      var dashboardAndMetrics = _.extend({}, this.dashboard);
      dashboardAndMetrics.modules = [];

      _.each(results, function (result) {
        if (result.state === 'fulfilled') {
          if (result.value.parentModule) {
            result.value.parentModule.modules
              .push(result.value);
            delete result.value.parentModule;
          } else {
            dashboardAndMetrics.modules.push(result.value);
          }
        }
      }, this);
      // for any modules with submodules eg. a section, move its modules array up a level
      _.each(dashboardAndMetrics.modules, function (module) {
        if (module.moduleConfig.modules) {
          module.modules = module.moduleConfig.modules;
          delete module.moduleConfig.modules;
        }
      });

      return dashboardAndMetrics;
    }, this));
};

/**
 *
 * @param moduleList
 * @param modules
 * @param {object} [parentModule]
 */
Dashboard.prototype.getModules = function (moduleList, modules, parentModule) {
  _.each(modules, function (module) {
    var nestedModules;
    moduleList.push(this.getModule(module, parentModule));
    if (module.modules) {
      nestedModules = module.modules;
      module.modules = [];
      this.getModules(moduleList, nestedModules, module);
    }
  }, this);
};

/**
 *
 * @param module
 * @param {object} [parentModule]
 * @returns {*}
 */
Dashboard.prototype.getModule = function (module, parentModule) {
  var newMod = new Module(module, {backdrop: this.options.backdrop});
  return newMod.resolve().then(function (module) {
    if (parentModule) {
      module.parentModule = parentModule;
    }
    return module;
  });
};

module.exports = Dashboard;
