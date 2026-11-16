"""Role-based access helpers.

A user is an *administrator* when one of its active roles is named ``admin``
(``backend.common.enums.Role.ADMIN``). Everybody else is a regular user.

Use ``DependsAdmin`` on any route (or router) that must be restricted to the
admin space. It relies on ``request.user`` being populated by the JWT
authentication middleware.
"""
from fastapi import Depends, Request

from backend.common.enums import Role
from backend.common.exception.errors import AuthorizationError, TokenError
from backend.common.security.jwt import DependsJwtAuth


def user_is_admin(user) -> bool:
    """True when *user* holds an active ``admin`` role."""
    roles = getattr(user, 'roles', None) or []
    for role in roles:
        name = role.get('name') if isinstance(role, dict) else getattr(role, 'name', None)
        status = role.get('status', 1) if isinstance(role, dict) else getattr(role, 'status', 1)
        if name == Role.ADMIN.value and status:
            return True
    return False


def admin_verify(request: Request, _token=DependsJwtAuth) -> None:
    """Reject the request unless the authenticated user is an administrator."""
    if not request.auth.scopes:
        raise TokenError
    if not user_is_admin(request.user):
        raise AuthorizationError(msg='Administrator access required')


# Dependency: restrict a route / router to administrators.
DependsAdmin = Depends(admin_verify)
