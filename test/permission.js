/* eslint-disable no-unused-expressions */
require('chai').should()
const { Principal } = require('../')
const Permission = require('../lib/permission')
const { PrincipalPermissionDenied } = require('../lib/errors')

describe('permission', function () {
  it('try', function () {
    let principal = new Principal()
      .addAction('edit')
      .addObject('order')
      .addObject('appointment')
      .addDecoration('in3Days')

    let edit = principal.getAction('edit')

    principal
      .setScope([
        edit.order
      ])

    let permission = new Permission(principal, edit.order)

    let { passed, failed } = permission.try()
    passed[0].toString().should.be.equal(edit.order.toString())
    failed.length.should.be.equal(0)

    permission = new Permission(principal, edit.appointment)
    permission.can().should.be.false
    ;(() => permission.test()).should.throw(PrincipalPermissionDenied)

    {
      permission = new Permission(principal,
        [edit.order, edit.appointment])
      permission.can().should.be.false
      let { passed, failed } = permission.try()
      passed[0].toString().should.be.equal(edit.order.toString())
      failed[0].toString().should.be.equal(edit.appointment.toString())
      ;(() => permission.test()).should.throw(PrincipalPermissionDenied)
    }

    principal
      .setScope(scope => scope.concat(edit.appointment))

    permission = new Permission(principal, edit.appointment)
    permission.can().should.be.true
    permission = new Permission(principal, [edit.order, edit.appointment])
    permission.can().should.be.true
  })
  it('with arguments', function () {
    let principal = new Principal()

    principal
      .addAction('edit')
      .addObject('book')
      .addDecoration('bad')
      .addDecoration('horror')
      .addNeedHandler('edit.book.bad', function editBookBad (book) {
        return book.bad
      })
      .setScope(
        'edit.book.bad',
        'edit.book.horror'
      )

    let permission = new Permission(principal,
      'edit.book.bad',
      'edit.book.horror'
    )

    permission.can({
      'edit.book.bad': {
        bad: true
      }
    }).should.be.true

    permission.can({
      'edit.book.bad': {
        bad: false
      }
    }).should.be.false

    // I have a strong need
    principal.setScope(it => it.concat('edit.book'))
    permission.can({
      'edit.book.bad': {
        bad: false
      }
    }).should.be.true
  })
})
