[![Build Status](https://travis-ci.org/alphagov/performanceplatform-client.js.svg?branch=master)](https://travis-ci.org/alphagov/performanceplatform-client.js)

# Performance Platform JavaScript client

A JavaScript client for the Performance Platform. It communicates with the Performance Platform API and can be used on both the front and backend using CommonJS.

Available on the npm registry.

# Usage

```javascript
var Dashboard = require('performanceplatform-client.js');

new Dashboard().getConfig('dashboard-slug')
.then(function (dashboardConfig) {
  var dashboard = JSON.parse(dashboardConfig);
  // Do something with the dashboard data
  // ...
});
```
