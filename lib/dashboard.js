var rp = require('./request-promise'),
    config = require('../config');

function Dashboard () {
  //do nothing right now
}

Dashboard.prototype.getConfig = function (slug) {
  var options = {
    url: config.stagecraft + 'public/dashboards?slug=' + slug
  };

  return rp(options);
};

module.exports = Dashboard;
