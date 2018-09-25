const { PrincipalPermissionDenied } = require('./errors')
const { Need } = require('./need')

class BasePermission {
  constructor (prinicpal) {
    this._principal = prinicpal
  }

  get principal () {
    return this._principal
  }

  or (permissions) {
    permissions = [].concat(permissions)
    let { principal } = this
    permissions = permissions.map(permission => {
      if (typeof permission === 'string') {
        permission = principal.assureNeed(permission)
      }
      if (permission instanceof Need) {
        permission = new AtomPermission(principal, permission)
      }
      return permission
    })
    for (let permission of permissions) {
      if (permission.principal !== principal) {
        throw new Error('you can only and permission with the same principal')
      }
    }
    return new OrCompoundPermission(this._principal, [this, ...permissions])
  }

  and (permissions) {
    permissions = [].concat(permissions)
    let { principal } = this
    permissions = permissions.map(permission => {
      if (typeof permission === 'string') {
        permission = principal.assureNeed(permission)
      }
      if (permission instanceof Need) {
        permission = new AtomPermission(principal, permission)
      }
      return permission
    })
    for (let permission of permissions) {
      if (permission.principal !== principal) {
        throw new Error('you can only and permission with the same principal')
      }
    }
    return new AndCompoundPermission(this.principal, [this, ...permissions])
  }

  try (args) {
    return this.can(args)
      .then(b => {
        if (!b) {
          throw new PrincipalPermissionDenied(this)
        }
      })
  }
}

class AtomPermission extends BasePermission {
  constructor (principal, need) {
    super(principal)
    this._need = this._principal.assureNeed(need)
  }

  get handlers () {
    return this._principal.getNeedHandlers(this._need)
  }

  async can (args) {
    const { resolve } = require('./need')
    args = args && args[this._need]
    let ok = false
    for (let need of this._principal.scope) {
      ok = resolve(need).pass(this._need)
      // arguments must be provided and principal has no higher need
      if (ok &&
        args &&
        need.toString() === this._need.toString() &&
        this.handlers.length
      ) {
        for (let handler of this.handlers) {
          ok = ok && await Promise.resolve(
            handler.apply(this._principal, [args])
          )
          if (!ok) {
            break
          }
        }
      }
      if (ok) {
        break
      }
    }
    return ok
  }
}

const Permission = AtomPermission

class AndCompoundPermission extends BasePermission {
  constructor (principal, permissions) {
    super(principal)
    if (permissions.length < 2) {
      throw new Error('you must provide at least 2 permissions to or-operand')
    }
    for (let permission of permissions) {
      if (permission.principal !== principal) {
        throw new Error('you must "and" permissions with the same principal')
      }
    }
    this._permissions = permissions
  }

  can (args) {
    return this.test(args)
      .then(it => it.failed.length === 0)
  }

  async test (args) {
    let passed = []
    let failed = []

    for (let permission of this._permissions) {
      if (await permission.can(args)) {
        passed.push(permission)
      } else {
        failed.push(permission)
      }
    }

    return { passed, failed }
  }
}

class OrCompoundPermission extends BasePermission {
  constructor (principal, permissions) {
    super(principal)
    this._permissions = permissions
    if (permissions.length < 2) {
      throw new Error('you must provide at least 2 permissions to or-operand')
    }
    for (let i = 0; i < permissions.length; ++i) {
      if (permissions[i].principal !== principal) {
        throw new Error('all permission must be with the same principal')
      }
    }
  }

  async can (args) {
    for (let permission of this._permissions) {
      if (await permission.can(args)) {
        return true
      }
    }
    return false
  }
}

function createPermission (principal, needs, op = 'and') {
  needs = [].concat(needs)
  if (!needs || !needs.length) {
    throw new Error('please provide needs to create permission')
  }
  if (needs.length === 1) {
    return new AtomPermission(principal, needs[0])
  }
  return new ({
    and: AndCompoundPermission,
    or: OrCompoundPermission
  }[op])(principal, needs.map(it => new AtomPermission(principal, it)))
}

module.exports = {
  createPermission, Permission, AtomPermission, OrCompoundPermission, AndCompoundPermission
}
