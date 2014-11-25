var Q = require('q'),
  request = process.browser ? require('browser-request') : require('request'),
  _ = require('underscore');


module.exports = function requestPromise (url, options, logger) {
  var deferred = Q.defer();
  var log = logger || console;
  options = options || {};

  if (url) {
    options = _.extend({
      url: url
    }, options);

    log.info('Making a request to:', options.url);

    request(options, function (err, res, body) {
      if (err) {
        return deferred.reject(err);
      } else if (res.statusCode !== 200) {
        log.error('Unexpected status code: ' + res.statusCode);
        err = new Error('Unexpected status code: ' + res.statusCode);
        err.res = res;
        return deferred.reject(err);
      }
      return deferred.resolve(body);
    });
  } else {
    deferred.reject(
      new Error('Please provide a url to query')
    );
  }

  return deferred.promise;
};