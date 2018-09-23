require('should')
const { Principal } = require('../')
const Permission = require('../lib/permission')
const { PrincipalPermissionDenied } = require('../lib/errors')

describe('permission', function () {
  it('test', async function () {
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

    let { passed, failed } = await permission.test()
    passed[0].toString().should.be.equal(edit.order.toString())
    failed.length.should.be.equal(0)

    permission = new Permission(principal, edit.appointment)
    await permission.can().should.be.resolvedWith(false)
    await permission.try().should.be.rejectedWith(PrincipalPermissionDenied)

    {
      permission = new Permission(principal,
        [edit.order, edit.appointment])
      await permission.can().should.be.resolvedWith(false)
      let { passed, failed } = await permission.test()
      passed[0].toString().should.be.equal(edit.order.toString())
      failed[0].toString().should.be.equal(edit.appointment.toString())
      await permission.try().should.be.rejectedWith(PrincipalPermissionDenied)
    }

    principal
      .setScope(scope => scope.concat(edit.appointment))

    permission = new Permission(principal, edit.appointment)
    await permission.can().should.be.resolvedWith(true)
    permission = new Permission(principal, [edit.order, edit.appointment])
    await permission.can().should.be.resolvedWith(true)
  })
  it('with arguments', async function () {
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

    await permission.can({
      'edit.book.bad': {
        bad: true
      }
    }).should.be.resolvedWith(true)

    await permission.can({
      'edit.book.bad': {
        bad: false
      }
    }).should.be.resolvedWith(false)

    // I have a strong need
    principal.setScope(it => it.concat('edit.book'))
    await permission.can({
      'edit.book.bad': {
        bad: false
      }
    }).should.be.resolvedWith(true)
  })

  it('and or', async function () {
    let principal = new Principal()
      .addAction('view')
      .addObject('user')
      .addObject('blog')

    let permission = new Permission(principal, 'view.blog')
      .or(new Permission(principal, 'view.user'))

    principal.setScope('view.blog')
    await permission.can().should.be.resolvedWith(true)
    // principal.setScope('view.user')
    // await permission.can().should.be.resolvedWith(true)
  })
})
