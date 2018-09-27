class PrincipalInvalidObject extends Error { }
class PrincipalInvalidDecoration extends Error { }
class PrincipalInvalidAction extends Error {}

function elaboratePermission (permission, originalError) {
  const { AtomPermission, OrCompoundPermission } = require('./permission')
  // AndCompoundPermission.try will throw PrincipalPermissionDenied which permission type
  // is either OrCompoundPermission or AtomPermission
  if (permission instanceof AtomPermission) {
    let s = permission.need.toString()
    if (originalError) {
      s += '(' + originalError.message + ')'
    }
    return s
  } else if (permission instanceof OrCompoundPermission) {
    return permission.children.map((it, idx) => elaboratePermission(it, originalError[idx])).join(' or ')
  }
}

class PrincipalPermissionDenied extends Error {
  constructor (permission, originalError) {
    super(
      'Permissions denied, the following needs are required:\n' +
      elaboratePermission(permission, originalError)
    )
    this.permission = permission
    this.originalError = originalError
  }
}

module.exports = {
  PrincipalInvalidObject,
  PrincipalInvalidDecoration,
  PrincipalPermissionDenied,
  PrincipalInvalidAction
}
