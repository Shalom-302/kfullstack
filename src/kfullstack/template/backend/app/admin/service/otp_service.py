"""One-time codes delivered over WhatsApp (adapted from the Foody implementation).

Storage: a Redis hash ``{OTP_REDIS_PREFIX}:{purpose}:{phone}`` holding an HMAC of
the code (never the code itself) and an attempt counter, with a TTL.

Abuse protection:
- per-phone hourly send quota (``OTP_MAX_SENDS_PER_PHONE_HOUR``);
- resend cooldown (``OTP_RESEND_COOLDOWN_SECONDS``);
- attempts counted atomically (HINCRBY) before comparing, the code is burned
  after ``OTP_MAX_ATTEMPTS`` wrong tries;
- constant-time comparison, single-use codes;
- per-IP rate limiting is applied on the routes.
"""
import hashlib
import hmac
import secrets

from backend.common.exception import errors
from backend.common.log import log
from backend.common.whatsapp import WhatsappUnreachable, send_whatsapp_text
from backend.common.whatsapp.gowa import mask_phone
from backend.core.conf import settings
from backend.database.db_redis import redis_client
from backend.utils.translator import Translator


def _key(phone: str, purpose: str) -> str:
    return f'{settings.OTP_REDIS_PREFIX}:{purpose}:{phone}'


def _cooldown_key(phone: str, purpose: str) -> str:
    return f'{settings.OTP_REDIS_PREFIX}:cooldown:{purpose}:{phone}'


def _quota_key(phone: str) -> str:
    return f'{settings.OTP_REDIS_PREFIX}:sends:{phone}'


def _digest(phone: str, purpose: str, code: str) -> str:
    msg = f'{purpose}:{phone}:{code}'.encode()
    return hmac.new(settings.TOKEN_SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


def _gen_code() -> str:
    return ''.join(secrets.choice('0123456789') for _ in range(settings.OTP_LENGTH))


class OtpService:
    @staticmethod
    async def can_resend(phone: str, purpose: str = 'login') -> bool:
        try:
            return not await redis_client.get(_cooldown_key(phone, purpose))
        except Exception:  # noqa: BLE001 - Redis down: start() will fail cleanly
            return True

    @staticmethod
    async def _consume_quota(phone: str, t: Translator) -> None:
        key = _quota_key(phone)
        try:
            count = await redis_client.incr(key)
            if count == 1:
                await redis_client.expire(key, 3600)
        except Exception as exc:  # noqa: BLE001
            log.error(f'OTP quota unavailable: {exc}')
            raise errors.ServerError(msg=t.t('whatsapp.unavailable')) from exc
        if count > settings.OTP_MAX_SENDS_PER_PHONE_HOUR:
            raise errors.ForbiddenError(msg=t.t('whatsapp.too_many_sends'))

    @classmethod
    async def start(cls, phone: str, t: Translator, purpose: str = 'login') -> None:
        """Generate a code, store its HMAC (TTL + fresh attempt counter), send it."""
        await cls._consume_quota(phone, t)
        code = _gen_code()
        key = _key(phone, purpose)
        try:
            await redis_client.delete(key)
            await redis_client.hset(key, mapping={'digest': _digest(phone, purpose, code), 'attempts': 0})
            await redis_client.expire(key, settings.OTP_TTL_SECONDS)
        except Exception as exc:  # noqa: BLE001
            log.error(f'OTP store failed for {mask_phone(phone)}: {exc}')
            raise errors.ServerError(msg=t.t('whatsapp.unavailable')) from exc

        message = t.t(
            f'whatsapp.message_{purpose}',
            brand=settings.BRAND_NAME,
            code=code,
            minutes=max(1, settings.OTP_TTL_SECONDS // 60),
        )
        try:
            await send_whatsapp_text(phone, message)
        except WhatsappUnreachable:
            await redis_client.delete(key)
            # 4xx so the form can show the reason.
            raise errors.ForbiddenError(msg=t.t('whatsapp.unreachable'))
        except Exception:
            await redis_client.delete(key)
            raise
        try:
            await redis_client.setex(_cooldown_key(phone, purpose), settings.OTP_RESEND_COOLDOWN_SECONDS, '1')
        except Exception:  # noqa: BLE001
            pass

    @staticmethod
    async def verify(phone: str, code: str, t: Translator, purpose: str = 'login') -> None:
        """Return if the code matches, raise otherwise. Codes are single-use."""
        key = _key(phone, purpose)
        try:
            digest = await redis_client.hget(key, 'digest')
            if not digest:
                raise errors.ForbiddenError(msg=t.t('whatsapp.code_expired'))
            # Count the attempt *before* comparing, atomically.
            attempts = await redis_client.hincrby(key, 'attempts', 1)
        except errors.ForbiddenError:
            raise
        except Exception as exc:  # noqa: BLE001
            log.error(f'OTP read failed for {mask_phone(phone)}: {exc}')
            raise errors.ServerError(msg=t.t('whatsapp.unavailable')) from exc

        if attempts > settings.OTP_MAX_ATTEMPTS:
            await redis_client.delete(key)
            raise errors.ForbiddenError(msg=t.t('whatsapp.too_many_attempts'))
        if not hmac.compare_digest(digest, _digest(phone, purpose, str(code).strip())):
            remaining = settings.OTP_MAX_ATTEMPTS - attempts
            if remaining <= 0:
                await redis_client.delete(key)
                raise errors.ForbiddenError(msg=t.t('whatsapp.too_many_attempts'))
            raise errors.ForbiddenError(msg=t.t('whatsapp.wrong_code', remaining=remaining))
        await redis_client.delete(key)


otp_service: OtpService = OtpService()
