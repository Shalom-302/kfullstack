"""Project management commands that run *inside* the api container.

The host ``{{cli}}`` wrapper invokes these over ``docker compose exec``. For
example ``{{cli}} auth init`` runs, inside the container::

    python -m backend.cli create-admin --email you@example.com --password ...

Kept on argparse + asyncio (stdlib only) so it has no extra dependency beyond
the backend itself.
"""
from __future__ import annotations

import argparse
import asyncio


async def create_admin_phone(phone: str) -> int:
    """Grant the admin role to a WhatsApp number (account created if needed)."""
    from backend.common.enums import Role as RoleEnum
    from backend.crud.crud_user import user_dao
    from backend.database.db_postgres import async_db_session
    from backend.utils.phone import normalize_phone

    try:
        phone = normalize_phone(phone)
    except ValueError as exc:
        print(f"[error] {exc}")
        return 1
    async with async_db_session.begin() as db:
        user = await user_dao.get_by_phone(db, phone)
        if user is None:
            await user_dao.add_by_phone(db, phone, role_name=RoleEnum.ADMIN.value)
            print(f"[ok] Admin account created for +{phone}")
        else:
            await user_dao.grant_role(db, user, RoleEnum.ADMIN.value)
            # Drop the JWT middleware's cached user so the new role applies now.
            from backend.core.conf import settings
            from backend.database.db_redis import redis_client

            await redis_client.delete(f"{settings.JWT_USER_REDIS_PREFIX}:{user.x_id}")
            print(f"[ok] +{phone} is now an administrator")
    print("     Log in with WhatsApp from the frontend (/auth/login).")
    return 0


async def create_admin(email: str, password: str) -> int:
    """Create an admin user (idempotent) so you can log into Swagger."""
    from backend.app.admin.schema.user import UserRegister
    from backend.common.enums import Role as RoleEnum
    from backend.crud.crud_user import user_dao
    from backend.database.db_postgres import async_db_session

    async with async_db_session() as db:
        if await user_dao.get_by_email(db, email) is not None:
            print(f"[skip] A user with email {email} already exists.")
            return 0

        # Public sign-ups get the 'user' role; only this trusted command
        # creates administrators.
        await user_dao.add(db, UserRegister(email=email, password=password), role_name=RoleEnum.ADMIN.value)
        await db.commit()

    print(f"[ok] Admin user created: {email}")
    print("     Log in at /admin/api/v1/docs with this email and password.")
    return 0


def storage_init() -> int:
    """Ensure the configured object-storage bucket exists."""
    # Importing the singleton constructs the client, which creates the bucket
    # if it is missing (see MinioStorage.__init__).
    from backend.common.cloud_storage import mstorage
    from backend.core.conf import settings

    bucket = settings.MINIO_BUCKET_NAME
    if not mstorage.client.bucket_exists(bucket):
        mstorage.create_bucket()
        print(f"[ok] Created bucket: {bucket}")
    else:
        print(f"[skip] Bucket already exists: {bucket}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="backend.cli", description="shaapi project management commands"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    ca = sub.add_parser("create-admin", help="Create an admin user")
    ca.add_argument("--email", help="Admin email (login).")
    ca.add_argument("--password", help="Admin password.")
    ca.add_argument("--phone", help="Admin WhatsApp number (passwordless login).")

    sub.add_parser("storage-init", help="Ensure the object-storage bucket exists")

    args = parser.parse_args()
    if args.command == "create-admin":
        if args.phone:
            return asyncio.run(create_admin_phone(args.phone))
        if not (args.email and args.password):
            parser.error("create-admin needs --phone, or --email and --password")
        return asyncio.run(create_admin(args.email, args.password))
    if args.command == "storage-init":
        return storage_init()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
