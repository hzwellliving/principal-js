class PrincipalInvalidObject extends Error { }
class PrincipalInvalidDecoration extends Error { }
class PrincipalInvalidAction extends Error {}

class PrincipalPermissionDenied extends Error {
  constructor (permission) {
    super('permission(s) denied')
    this._permission = permission
  }
}

module.exports = {
  PrincipalInvalidObject,
  PrincipalInvalidDecoration,
  PrincipalPermissionDenied,
  PrincipalInvalidAction
}
