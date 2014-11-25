var Q = require('q'),
  request = process.browser ? require('browser-request') : require('request');


module.exports = function requestPromise (options, logger) {
  try {


    var deferred = Q.defer();
    var log = logger || console;
    options = options || {};

    if (options.url) {

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
  } catch (er) {
    console.log(er);
  }
};
