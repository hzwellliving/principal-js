require('should')
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

    resolve(view).inherited(edit).should.be.exactly(false)
    resolve(edit).inherited(view).should.be.exactly(true)
    resolve(remove).inherited(view).should.be.exactly(true)
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

    resolve(view).pass(view).should.be.exactly(true)
    resolve(edit).pass(view).should.be.exactly(true)
    resolve(remove).pass(view).should.be.exactly(true)
  })
})
