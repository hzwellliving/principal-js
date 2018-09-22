const debug = require('debug')('principal')
const errors = require('./lib/errors')

const Permission = require('./lib/permission')
const { createAction } = require('./lib/action')
const needLib = require('./lib/need')
const actionLib = require('./lib/action')

function objectValues (obj) {
  let ret = []
  for (let k in obj) {
    if (obj.hasOwnProperty(k)) {
      ret.push(obj[k])
    }
  }
  return ret
}

class Principal {
  constructor () {
    this._actions = {}
    this._objects = {}
    this._decorations = {}
    this._scope = []
    this._needHandlers = {}
    this._defaultLabelTemplate = ({ action, object, decorations }) => {
      let s = action + ' ' + object
      if (decorations) {
        s += `[${decorations.join(',')}]`
      }
      return s
    }
    this.actions = (function (principal) {
      return new Proxy({}, {
        get (obj, prop) {
          return principal.getAction(prop)
        }
      })
    })(this)
  }

  getNeedHandlers (need) {
    // need will be converted using toString automatically, so don't worry
    // if it is a Need
    return this._needHandlers[need]
  }

  getAction (name) {
    let ret = this._actions[name]
    if (!ret) {
      throw new errors.PrincipalInvalidAction('invalid action ' + name)
    }
    return ret
  }

  fromJson (json) {
    let { actions, objects, decorations, scope } = typeof json === 'string' ? JSON.parse(json) : json

    for (let action of actions) {
      this.addAction(action.name, action.label, action.inheritFrom)
    }
    for (let object of objects) {
      this.addObject(object.name, object.label)
    }
    for (let { name, label } of decorations) {
      this.addDecoration(name, label)
    }
    this.setScope(scope.map(({ action, object, decorations }) => {
      let ret = this.getAction(action)[object]
      for (let decoration of decorations) {
        ret = ret[decoration]
      }
      return ret
    }))
    return this
  }

  toJson () {
    return {
      actions: objectValues(this._actions).map(it => actionLib.resolve(it).toJson()),
      objects: objectValues(this._objects),
      decorations: objectValues(this._decorations),
      scope: this._scope.map(it => {
        it = needLib.resolve(it)
        return {
          action: actionLib.resolve(it.action).name,
          object: it.object.name,
          decorations: it.decorations.map(it => it.name)
        }
      })
    }
  }

  setLabelTemplate (template) {
    this._labelTemplate = template
  }

  getNeedLabel ({ action, object, decorations }) {
    return (this._labelTemplate || this._defaultLabelTemplate).apply(
      this, [{ action, object, decorations }])
  }

  addAction (name, label, inheritFrom) {
    debug('add action ' + name)
    inheritFrom = inheritFrom || []

    if (this._actions[name]) {
      throw new Error('there is an action with the same name ' + name)
    }

    inheritFrom = [].concat(inheritFrom).map(it => {
      let action = this._actions[it]
      if (!action) {
        throw new Error('no such action ' + it)
      }
      return action
    })

    this._actions[name] = createAction({
      name, label: label || name, inheritFrom
    }, this)
    return this
  }

  addObject (name, label) {
    this._objects[name] = { name, label: label || name }
    return this
  }

  addDecoration (name, label) {
    this._decorations[name] = { name, label: label || name }
    return this
  }

  addNeedHandler (need, handler) {
    // need will be converted to string using toString if IT IS A NEED
    this._needHandlers[need] = (this._needHandlers[need] || []).concat(handler)
    return this
  }

  setScope (...args) {
    if (Array.isArray(args[0])) {
      this._scope = args[0]
    } else if (typeof args[0] === 'function') {
      this._scope = [].concat(args[0].apply(this, [this._scope]))
    } else {
      this._scope = args
    }
    this._scope = this._scope.map(need => typeof need === 'string'
      ? this.assureNeed(need)
      : need
    )
    return this
  }

  get scope () {
    return this._scope
  }

  can (needs, args) {
    return new Permission(this, needs).can(args)
  }

  test (needs, args) {
    return new Permission(this, needs).try(args)
  }

  try (needs, args) {
    return new Permission(this, needs).try(args)
  }

  hasBiggerNeedsThan (need, args) {
    need = this.assureNeed(need)
    let ret = false
    for (let myNeed of this._scope) {
      if (needLib.resolve(myNeed).pass(need) && myNeed.toString() !== need.toString()) {
        ret = true
        break
      }
    }
    return ret
  }

  resolveNeed (need) {
    return needLib.resolveNeed(this.assureNeed(need))
  }

  canOnly (need, args) {
    if (typeof need === 'string') {
      need = this.assureNeed(need)
    }
    let { passed } = new Permission(this, need).try(args)
    console.log(passed.map(it => it.toString()))
    return passed.length === 1 && passed[0].toString() === need.toString()
  }

  assureNeed (arg) {
    if (arg instanceof needLib.Need) {
      return arg
    }
    if (typeof arg === 'string') {
      arg = needLib.parseNeed(arg)
    }
    let { action, object, decorations } = arg
    return decorations.reduce((a, b) => a[b], this.getAction(action)[object])
  }

  clone () {
    let ret = new Principal().fromJson(this.toJson())
    ret._labelTemplate = this._labelTemplate
    return ret
  }
}

function permission (...needs) {
  return new Permission(_principal, ...needs)
}

var _principal = new Principal()

module.exports = {
  Principal,
  Permission,
  permission,
  // singleton
  principal: _principal,
  errors
}
