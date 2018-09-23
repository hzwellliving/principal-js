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
    return this.test(args)
      .then(({ failed }) => {
        if (failed.length) {
          throw new PrincipalPermissionDenied(failed)
        }
      })
  }

  can (args) {
    return this.test(args)
      .then(it => it.failed.length === 0)
  }

  async test (args) {
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
            for (let handler of handlers) {
              ok = ok && await Promise.resolve(handler.apply(this.principal, [args[try_]]))
              if (!ok) {
                break
              }
            }
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
  or (permission) {
    return new OrCompoundPermission([this, permission])
  }

  // TODO
  get complement () { }
}

class OrCompoundPermission {
  constructor (permissions) {
    this._permissions = permissions
    if (permissions.length < 2) {
      throw new Error('you must provide at least 2 permissions to or-operand')
    }
    if (permissions.length) {
      let prinicpal = permissions[0].principal
      for (let i = 1; i < permissions.length; ++i) {
        if (permissions[i].principal !== prinicpal) {
          throw new Error('all permission must be with the same principal')
        }
      }
    }
  }

  /**
   * throw lacked needs
   */
  try (args) {
    return this.test(args)
      .then(({ failed }) => {
        if (failed.length) {
          throw new PrincipalPermissionDenied(failed)
        }
      })
  }

  can (args) {
    return this.test(args)
      .then(it => it.failed.length === 0)
  }

  get principal () {
    return this._permissions[0].principal
  }

  async test (args) {
    let passedSet = new Set()
    let failedMap = {}
    for (let permission of this._permissions) {
      let { passed, failed } = await permission.test(args)
      passed.reduce((s, n) => s.add(n.toString()), passedSet)
      for (let need of failed) {
        if (!failedMap.hasOwnProperty(need)) {
          failedMap[need] = 0
        }
        failedMap[need] += 1
      }
    }
    let failed = []
    // only need failed in all permission will considered to be failed
    for (let need in failedMap) {
      if (need) {
        if (failedMap[need] === this._permissions.length) {
          failed.push(need)
        }
      }
    }
    let principal = this.principal
    return {
      passed: Array.from(passedSet).map(it => principal.assureNeed(it)),
      failed: failed.map(it => principal.assureNeed(it))
    }
  }
}

module.exports = Permission
