global.sinon = require('sinon');
global.should = require('chai').use(
  require('sinon-chai')
).use(
  require('chai-as-promised')
).should();
global.expect = require('chai').expect;
