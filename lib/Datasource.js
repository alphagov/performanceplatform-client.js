var rp = require('./request-promise'),
  config = require('../config'),
  _ = require('lodash'),
  moment = require('moment-timezone');

function Datasource (dataSourceConfig, options) {
  this.options =_.extend({
    json: true,
    url: config.backdrop,
    qs: {
      flatten: true
    }
  }, options);

  _.extend(this.options, {
    url: this.options.url + 'data/' +
      dataSourceConfig['data-group'] + '/' + dataSourceConfig['data-type'],
    qs: _.extend(dataSourceConfig['query-params'], this.options.qs,
      (dataSourceConfig['query-params']['period']) ? {} :
      {'sort_by': '_timestamp:descending'} )
  });

  this.options.qs = configureTimespans(this.options.qs);
}

Datasource.prototype.getData = function () {
  return rp(this.options);
};

module.exports = Datasource;

function configureTimespans (queryParams) {
  var PERIOD_TO_DURATION = {
      hour: 24,
      day: 30,
      week: 9,
      month: 12,
      quarter: 24
    },
    ISO_8601 = 'YYYY-MM-DD[T]HH:mm:ss[Z]';
  if (queryParams.start_at && !queryParams.end_at && !queryParams.duration) {
    queryParams.end_at = moment();
  } else if (queryParams.start_at && queryParams.end_at && queryParams.duration) {
    delete queryParams.duration;
  }
  if (queryParams.period && !queryParams.duration && !(queryParams.start_at &&
    queryParams.end_at)) {
    queryParams.duration =
      PERIOD_TO_DURATION[queryParams.period];
  }
  if (!queryParams.period) {
    queryParams.limit = queryParams.limit || 5;
  }
  _.each(['start_at', 'end_at'], function (prop) {
    if (queryParams[prop]) {
      queryParams[prop] = moment(queryParams[prop]).utc().format(ISO_8601);
    }
  });
  return queryParams;
}
