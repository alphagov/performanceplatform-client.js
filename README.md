[![Build Status](https://travis-ci.org/alphagov/performanceplatform-client.js.svg?branch=master)](https://travis-ci.org/alphagov/performanceplatform-client.js)

# Performance Platform JavaScript client

A JavaScript client for the Performance Platform. It communicates with the Performance Platform API and can be used on both the front and backend using CommonJS.

# Installation

The client is available on the npm registry

```
npm install --save performanceplatform-client.js
```

# Usage

The client is composed of three sections. Dashboard, Module and Datasource. Each one can be used independently.

## Dashboard

```

var Dashboard = require('performanceplatform-client.js').Dashboard,
    dashboard = new Dashboard('prison-visits');

dashboard.resolve().then(function (dashboardAndData) {
  // this has returned a dashboard, it's config plus all modules resolved with their data
  console.log(JSON.stringify(dashboardAndData));
});

```

## Module

```

var Module = require('performanceplatform-client.js').Module,
    module = new Module(moduleConfig);

module.resolve().then(function (moduleData) {
  // this has the data for the module
  // rejects promise if the module isn't supported
  console.log(JSON.stringify(moduleData));
});

```

## Datasource

```

var Datasource = require('performanceplatform-client.js').Datasource,
    dataSource = new Datasource(dataSourceConfig);

dataSource.getData().then(function (data) {
  // returns the data for a datasource
  console.log(JSON.stringify(data));
});

```


## Table

```
var Table = require('performanceplatform-client.js').Table

var table = new Table(module);

table.render();

```