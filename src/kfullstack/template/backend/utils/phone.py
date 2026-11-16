"""Phone number normalization (WhatsApp login identifier).

Stored form: digits only, country code first, no ``+``. For example
``+33 6 12 34 56 78`` and ``0033612345678`` both become ``33612345678``; with
``PHONE_DEFAULT_COUNTRY_CODE=33`` the local form ``06 12 34 56 78`` does too.
This is also the form GOWA expects in front of the ``@s.whatsapp.net`` suffix.
"""
from backend.core.conf import settings


def normalize_phone(value: str) -> str:
    raw = (value or '').strip()
    digits = ''.join(ch for ch in raw if ch.isdigit())
    cc = settings.PHONE_DEFAULT_COUNTRY_CODE.lstrip('+')
    if raw.startswith('+'):
        pass
    elif digits.startswith('00'):
        digits = digits[2:]
    elif digits.startswith('0'):
        # Local number typed without the country code.

        if not cc:
            raise ValueError('Phone number must include the country code (e.g. +33...).')
        # Some numbering plans keep the leading 0 after the country code
        # (e.g. Cote d'Ivoire since 2021), most drop it (France...).
        digits = cc + (digits if settings.PHONE_KEEP_LEADING_ZERO else digits[1:])
    elif cc and not digits.startswith(cc.lstrip('+')) and len(digits) <= 10:
        # Short local form without a leading 0.
        digits = cc.lstrip('+') + digits
    if not (8 <= len(digits) <= 15):
        raise ValueError('Invalid phone number (country code + number, digits only).')
    return digits
