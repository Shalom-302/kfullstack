"""The single WhatsApp sender of the project: a GOWA client.

GOWA (go-whatsapp-web-multidevice) exposes ``POST {GOWA_URL}/send/message``
with HTTP Basic auth and the JSON body
``{"phone": "<digits>@s.whatsapp.net", "message": "..."}``.

Every WhatsApp message (OTP, notifications...) goes through
``send_whatsapp_text`` so there is exactly one integration to configure.
The *system* number is the WhatsApp account paired with the GOWA instance; user
numbers are only recipients. In dev without ``GOWA_URL`` the message is logged
instead of sent.
"""
import base64

import httpx

from backend.common.exception import errors
from backend.common.log import log
from backend.core.conf import settings

_WA_SUFFIX = '@s.whatsapp.net'


class WhatsappUnreachable(Exception):
    """GOWA answered but could not deliver to this number (not on WhatsApp...)."""


def _headers() -> dict:
    headers = {'Content-Type': 'application/json'}
    if settings.GOWA_BASIC_USER or settings.GOWA_BASIC_PASS:
        raw = f'{settings.GOWA_BASIC_USER}:{settings.GOWA_BASIC_PASS}'.encode()
        headers['Authorization'] = 'Basic ' + base64.b64encode(raw).decode()
    return headers


def mask_phone(phone: str) -> str:
    """Partially hide a number for logs."""
    return phone[:4] + '***' + phone[-2:] if len(phone) > 6 else '***'


async def send_whatsapp_text(phone: str, message: str) -> None:
    """Send *message* to a normalized phone number.

    :raises WhatsappUnreachable: the number cannot receive WhatsApp messages.
    :raises ServerError: GOWA is down, misconfigured or refused our credentials.
    """
    if not settings.GOWA_URL:
        if settings.ENVIRONMENT == 'dev':
            # info level: shown by `{{cli}} logs api` (warnings only reach stderr at ERROR level)
            log.info(f'[dev] GOWA_URL unset - WhatsApp message to {phone} NOT sent: {message}')
            return
        raise errors.ServerError(msg='WhatsApp service is not configured (GOWA_URL).')

    jid = phone if phone.endswith(_WA_SUFFIX) else f'{phone}{_WA_SUFFIX}'
    try:
        async with httpx.AsyncClient(timeout=settings.GOWA_TIMEOUT) as client:
            resp = await client.post(
                f'{settings.GOWA_URL.rstrip("/")}/send/message',
                json={'phone': jid, 'message': message},
                headers=_headers(),
            )
    except httpx.HTTPError as exc:
        log.error(f'GOWA unreachable while sending to {mask_phone(phone)}: {exc}')
        raise errors.ServerError(msg='WhatsApp service unavailable, try again later.') from exc

    if resp.status_code in (401, 403):
        # Our credentials, not the user's number.
        log.error(f'GOWA refused our credentials ({resp.status_code}): check GOWA_BASIC_USER / GOWA_BASIC_PASS')
        raise errors.ServerError(msg='WhatsApp service unavailable, try again later.')
    if resp.status_code >= 400:
        log.warning(f'GOWA could not deliver to {mask_phone(phone)} ({resp.status_code}): {resp.text[:200]}')
        raise WhatsappUnreachable(phone)
