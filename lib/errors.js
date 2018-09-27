class PrincipalInvalidObject extends Error { }
class PrincipalInvalidDecoration extends Error { }
class PrincipalInvalidAction extends Error {}

function elaboratePermission (permission) {
  const { AtomPermission, AndCompoundPermission, OrCompoundPermission } = require('./permission')
  if (permission instanceof AtomPermission) {
    return permission.need.toString()
  } else if (permission instanceof AndCompoundPermission) {
    return '(' + permission.children.map(elaboratePermission).join(', ') + ')'
  } else if (permission instanceof OrCompoundPermission) {
    return permission.children.map(elaboratePermission).join(' or ')
  }
}

class PrincipalPermissionDenied extends Error {
  constructor (permission) {
    super(
      'Permissions denied, the following needs are required:\n' +
      elaboratePermission(permission)
    )
    this._permission = permission
  }
}

module.exports = {
  PrincipalInvalidObject,
  PrincipalInvalidDecoration,
  PrincipalPermissionDenied,
  PrincipalInvalidAction
}
