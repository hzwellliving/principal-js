class PrincipalInvalidObject extends Error { }
class PrincipalInvalidDecoration extends Error { }
class PrincipalInvalidAction extends Error {}

class PrincipalPermissionDenied extends Error {
  constructor (failed) {
    super('permission(s) denied: ' + failed.map(it => it.toString()).join(','))
    this.failed = failed
  }
}

module.exports = {
  PrincipalInvalidObject,
  PrincipalInvalidDecoration,
  PrincipalPermissionDenied,
  PrincipalInvalidAction
}
