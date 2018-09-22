const { PrincipalPermissionDenied } = require('../lib/errors')

class Permission {
  constructor (principal, ...needs) {
    this.principal = principal
    if (Array.isArray(needs[0])) {
      needs = needs[0]
    }
    if (!needs || !needs.length) {
      throw new Error('you can\'t create permission without needs')
    }
    this.needs = needs.map(it => principal.assureNeed(it))
  }

  /**
   * throw lacked needs
   */
  try (args) {
    let { failed } = this.test(args)
    if (failed.length) {
      throw new PrincipalPermissionDenied(failed)
    }
  }

  can (args) {
    return this.test(args).failed.length === 0
  }

  test (args) {
    const { resolve } = require('./need')
    let passed = []
    // clone
    let tries = this.needs.slice(0)

    for (let userNeed of this.principal.scope) {
      for (let try_ of tries) {
        let handlers = this.principal.getNeedHandlers(try_)
        let ok = resolve(userNeed).pass(try_)
        if (ok) {
          // arguments must be provided and userNeed is equal to try_
          if (args &&
            args[try_] &&
            handlers &&
            handlers.length &&
            !this.principal.hasBiggerNeedsThan(try_)
          ) {
            ok = handlers.every(handler => handler.apply(this.principal, [args[try_]]))
          }
        }
        if (ok) {
          passed.push(try_)
        }
      }
      tries = tries.filter(it => passed.indexOf(it) === -1)
      if (!tries.length) {
        break
      }
    }
    return { passed, failed: tries }
  }

  // TODO
  intersect (permission) { }

  // TODO
  union (permission) { }

  // TODO
  get complement () { }
}

module.exports = Permission
