from pydantic import Field, field_validator

from backend.common.schema import SchemaBase
from backend.utils.phone import normalize_phone


class RequestOtpParam(SchemaBase):
    phone: str = Field(min_length=6, max_length=25, description='WhatsApp number, international form (+33...)')

    _norm = field_validator('phone')(normalize_phone)


class VerifyOtpParam(SchemaBase):
    phone: str = Field(min_length=6, max_length=25)
    code: str = Field(min_length=4, max_length=8, pattern=r'^\s*\d+\s*$')

    _norm = field_validator('phone')(normalize_phone)


class RequestOtpResult(SchemaBase):
    sent: bool = True
    phone: str
    expires_in: int
    resend_in: int
