/* eslint-disable no-unused-expressions */
require('chai').should()
let { resolve } = require('../lib/action')
let { Principal } = require('../')

describe('action', function () {
  it('inherited', function () {
    let principal = new Principal()

    principal
      .addAction('view')
      .addAction('edit', '', 'view')
      .addAction('remove', '', 'edit')

    let view = principal.getAction('view')
    let edit = principal.getAction('edit')
    let remove = principal.getAction('remove')

    resolve(view).inherited(edit).should.be.false
    resolve(edit).inherited(view).should.be.true
    resolve(remove).inherited(view).should.be.true
  })

  it('pass', function () {
    let principal = new Principal()

    principal
      .addAction('view')
      .addAction('edit', '', 'view')
      .addAction('remove', '', 'edit')

    let view = principal.getAction('view')
    let edit = principal.getAction('edit')
    let remove = principal.getAction('remove')

    resolve(view).pass(view).should.be.true
    resolve(edit).pass(view).should.be.true
    resolve(remove).pass(view).should.be.true
  })
})
