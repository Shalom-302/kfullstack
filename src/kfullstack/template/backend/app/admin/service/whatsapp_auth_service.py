"""Passwordless login: WhatsApp number + one-time code.

``request_otp`` answers the same way whether the number has an account or not
(the account is created on the first verified code), so the form cannot be used
to find out who is registered. New accounts get the ``user`` role; promote an
administrator with ``{{cli}} auth init --phone <number>``.
"""
from datetime import datetime

from fastapi import Request, Response
from starlette.background import BackgroundTasks

from backend.app.admin.schema.token import GetLoginToken
from backend.app.admin.schema.whatsapp import RequestOtpParam, RequestOtpResult, VerifyOtpParam
from backend.app.admin.service.login_log_service import LoginLogService
from backend.app.admin.service.otp_service import otp_service
from backend.common.enums import LoginLogStatusType
from backend.common.exception import errors
from backend.common.security.jwt import create_access_token, create_refresh_token
from backend.core.conf import settings
from backend.crud.crud_user import user_dao
from backend.database.db_postgres import async_db_session
from backend.database.db_redis import redis_client
from backend.utils.timezone import timezone
from backend.utils.translator import Translator


def _ensure_enabled(t: Translator) -> None:
    if not settings.WHATSAPP_AUTH_ENABLED:
        raise errors.NotFoundError(msg=t.t('whatsapp.disabled'))


def _set_refresh_cookie(response: Response, refresh_token: str, expire_time) -> None:
    response.set_cookie(
        key=settings.COOKIE_REFRESH_TOKEN_KEY,
        value=refresh_token,
        max_age=settings.COOKIE_REFRESH_TOKEN_EXPIRE_SECONDS,
        expires=timezone.f_utc(expire_time),
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.COOKIE_SECURE or settings.ENVIRONMENT != 'dev',
    )


async def _log_login(request: Request, user_x_id: str, phone: str, msg: str) -> None:
    async with async_db_session.begin() as db:
        await LoginLogService.create(
            db=db,
            request=request,
            user_x_id=user_x_id,
            email=phone,  # login_log.email holds the login identifier
            login_time=datetime.now(),
            status=LoginLogStatusType.success.value,
            msg=msg,
        )


class WhatsappAuthService:
    @staticmethod
    async def request_otp(*, request: Request, obj: RequestOtpParam) -> RequestOtpResult:
        t = Translator(request.state.locale)
        _ensure_enabled(t)
        if not await otp_service.can_resend(obj.phone):
            raise errors.ForbiddenError(msg=t.t('whatsapp.wait_before_resend'))
        await otp_service.start(obj.phone, t)
        return RequestOtpResult(
            phone=obj.phone,
            expires_in=settings.OTP_TTL_SECONDS,
            resend_in=settings.OTP_RESEND_COOLDOWN_SECONDS,
        )

    @staticmethod
    async def verify_otp(
        *, request: Request, response: Response, obj: VerifyOtpParam, background_tasks: BackgroundTasks
    ) -> dict:
        t = Translator(request.state.locale)
        _ensure_enabled(t)
        await otp_service.verify(obj.phone, obj.code, t)  # raises on bad/expired code

        async with async_db_session.begin() as db:
            user = await user_dao.get_by_phone(db, obj.phone)
            is_new = user is None
            if is_new:
                user = await user_dao.add_by_phone(db, obj.phone)
            elif not user.status:
                raise errors.AuthorizationError(msg=t.t('auth.account_locked'))
            user.last_login_time = timezone.now()
            x_id = user.x_id
            access_token = await create_access_token(str(x_id), user.is_multi_login)
            refresh_token = await create_refresh_token(str(x_id), user.is_multi_login)
            n_user = await user_dao.get_with_relation(db, x_id=x_id, populates=['roles'])
            data = GetLoginToken(
                access_token=access_token.access_token,
                access_token_expire_time=access_token.access_token_expire_time,
                user=n_user,  # type: ignore
            )

        # Drop the JWT middleware's cached copy of the user.
        await redis_client.delete(f'{settings.JWT_USER_REDIS_PREFIX}:{x_id}')
        background_tasks.add_task(_log_login, request, x_id, obj.phone, t.t('whatsapp.login_success'))
        _set_refresh_cookie(response, refresh_token.refresh_token, refresh_token.refresh_token_expire_time)
        return {**data.model_dump(), 'is_new_user': is_new}


whatsapp_auth_service: WhatsappAuthService = WhatsappAuthService()
