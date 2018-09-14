/* eslint-disable no-unused-expressions */
require('chai').should()
const decorationsPass = require('../lib/decorations-pass')

describe('decorations pass', function () {
  it('decorations pass', function () {
    decorationsPass([], [{ name: 'ofHisOwn ' }]).should.be.true
    decorationsPass([{ name: 'ofHisOwn ' }], []).should.be.false
    decorationsPass(
      [{ name: 'ofHisOwn' }], [{ name: 'ofHisOwn' }]
    ).should.be.true
    decorationsPass(
      [{ name: 'ofHisOwn' }],
      [{ name: 'ofHisOwn' }, { name: 'in3Days' }]
    ).should.be.true
    decorationsPass(
      [{ name: 'ofHisOwn' }, { name: 'in7Days' }],
      [{ name: 'ofHisOwn' }, { name: 'in3Days' }]
    ).should.be.false
    decorationsPass(
      [{ name: 'ofHisOwn' }, { name: 'in7Days' }],
      [{ name: 'ofHisOwn' }, { name: 'bad' }, { name: 'in7Days' }]
    ).should.be.true
  })
})
