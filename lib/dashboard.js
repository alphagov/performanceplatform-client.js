var Query = require('./querist'),
    config = require('../config');

function Dashboard () {
  //do nothing right now
}

Dashboard.prototype.getConfig = function (slug) {
  var client = new Query({
    baseUrl: config.stagecraft
  });

  return client.get('/public/dashboards?slug=' + slug);
};

module.exports = Dashboard;
