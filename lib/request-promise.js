var Q = require('q'),
  request = process.browser ? require('browser-request') : require('request'),
  qs = require('qs'),
  p = require('../package.json'),
  userAgent = p['name'] + '/' + p['version'],
  _ = require('lodash');

module.exports = function requestPromise (options, logger) {
  var deferred = Q.defer();
  var log = logger || console;
  options = options || {};

  //because useQuerystring doesn't exist in browser-request
  if (options.qs) {
    options.url += '?' + qs.stringify(options.qs, { indices: false });
    delete options.qs;
  }

  if (options.url) {
    log.info('Making a request to:', options.url);

    options.headers = _.extend({
      'user-agent': userAgent
    }, options.headers);

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
