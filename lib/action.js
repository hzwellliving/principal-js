const { PrincipalInvalidObject } = require('./errors')

const NAME_PROP = Symbol('name')
const LABEL_PROP = Symbol('label')
const INHERIT_FROM_PROP = Symbol('inherit_from')
const util = require('util')

/**
 * this is a utility class, if you need to get properties from an Action,
 * use this resolver
 */
class ActionResolver {
  constructor (action) {
    this._action = action
  }

  get name () {
    return this._action[NAME_PROP]
  }

  get label () {
    return this._action[LABEL_PROP]
  }

  get inheritFrom () {
    return this._action[INHERIT_FROM_PROP]
  }

  _getAncestorsIter (action) {
    // clone array
    let ret = resolve(action).inheritFrom.slice(0)
    for (let parentAction of ret.slice(0)) {
      ret = ret.concat(this._getAncestorsIter(parentAction))
    }
    return ret
  }

  get ancestors () {
    return this._getAncestorsIter(this._action)
  }

  inherited (targetAction) {
    return !!~this.ancestors.map(it => resolve(it).name).indexOf(
      targetAction instanceof Action
        ? resolve(targetAction).name
        : targetAction
    )
  }

  pass (targetAction) {
    targetAction = resolve(targetAction)
    return this.name === targetAction.name ||
      !!~this.ancestors.map(it => resolve(it).name).indexOf(targetAction.name)
  }

  toJson () {
    return {
      name: this.name,
      label: this.label,
      inheritFrom: this.inheritFrom.map(it => resolve(it).name)
    }
  }
}

const resolve = function resolve (action) {
  return new ActionResolver(action)
}

exports.resolve = resolve

class Action {
  constructor ({ name, label, inheritFrom }) {
    this[NAME_PROP] = name
    this[LABEL_PROP] = label
    this[INHERIT_FROM_PROP] = [].concat(inheritFrom)
  }

  [util.inspect.custom] () {
    return this[NAME_PROP]
  }
}

function createAction ({
  name, label, inheritFrom
}, principal) {
  let action = new Proxy(new Action({ name, label, inheritFrom }), {
    get (obj, prop) {
      if (prop in obj) {
        return obj[prop]
      }
      // bypass wellknown symbols like Symbol.iterator
      if (typeof prop === 'symbol') {
        return obj[prop]
      }
      let object = principal._objects[prop]
      if (object) {
        const { createNeed } = require('./need')
        return createNeed({ action, object, decorations: [] }, principal)
      }
      throw new PrincipalInvalidObject('invalid object ' + prop)
    }
  })
  return action
}

exports.createAction = createAction
