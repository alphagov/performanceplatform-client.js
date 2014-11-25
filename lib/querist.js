var _ = require('underscore'),
  request = require('../lib/request-promise');


function Querist(options) {

  var defaults = {
    baseUrl : null
  };

  this.config = _.extend({}, defaults, options);

}

Querist.prototype.get = function (url, options) {
  if (this.config.baseUrl) {
    url = [this.config.baseUrl, url].join('');
  }

  return request(url, options);
};

Querist.prototype.post = function (url, dataAndOptions) {
  if (this.config.baseUrl) {
    url = [this.config.baseUrl, url].join('');
  }

  dataAndOptions.method = 'POST';

  return request(url, dataAndOptions);
};

module.exports = Querist;
