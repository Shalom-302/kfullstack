import casbin
import casbin_async_sqlalchemy_adapter

from fastapi import Depends, Request

from backend.models.casbin_rule import CasbinRule
from backend.common.exception.errors import AuthorizationError, TokenError
from backend.common.security.jwt import DependsJwtAuth
from backend.common.security.permissions import user_is_admin
from backend.core.conf import settings
from backend.database.db_postgres import async_engine


class RBAC:
    @staticmethod
    async def enforcer() -> casbin.AsyncEnforcer:
        """
        Get the Casbin enforcer

        :return:
        """
        # Rule data is defined directly in the method as static data
        _CASBIN_RBAC_MODEL_CONF_TEXT = """
        [request_definition]
        r = sub, obj, act

        [policy_definition]
        p = sub, obj, act

        [role_definition]
        g = _, _

        [policy_effect]
        e = some(where (p.eft == allow))

        [matchers]
        m = g(r.sub, p.sub) && (keyMatch(r.obj, p.obj) || keyMatch3(r.obj, p.obj)) && (r.act == p.act || p.act == "*")
        """
        adapter = casbin_async_sqlalchemy_adapter.Adapter(async_engine, db_class=CasbinRule)
        model = casbin.AsyncEnforcer.new_model(text=_CASBIN_RBAC_MODEL_CONF_TEXT)
        enforcer = casbin.AsyncEnforcer(model, adapter)
        await enforcer.load_policy()
        return enforcer

    async def rbac_verify(self, request: Request, _token: str = DependsJwtAuth) -> None:
        """
        RBAC permission verification

        :param request:
        :param _token:
        :return:
        """
        path = request.url.path

        # Whitelist for authentication
        if path in settings.TOKEN_REQUEST_PATH_EXCLUDE:
            return
        
        # Enforce JWT authorization status check
        if not request.auth.scopes:
            raise TokenError
        
        # Administrators bypass fine-grained policies.
        if user_is_admin(request.user):
            return

        user_roles = [role for role in (request.user.roles or []) if role.status]
        if not user_roles:
            raise AuthorizationError(msg='User has no assigned roles, authorization failed')

        method = request.method
        if (method, path) in settings.RBAC_CASBIN_EXCLUDE:
            return

        # Casbin: allowed as soon as one of the user's roles is allowed.
        enforcer = await self.enforcer()
        for role in user_roles:
            if enforcer.enforce(role.name, path, method):
                return

        raise AuthorizationError


rbac = RBAC()
# RBAC authorization dependency injection
DependsRBAC = Depends(rbac.rbac_verify)
