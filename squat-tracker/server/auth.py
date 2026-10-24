"""
Supabase JWT verification for the FastAPI pose server.

The mobile app sends the Supabase access token as `Authorization: Bearer <jwt>`.
We verify the token's signature and expiry, then trust ONLY the `sub` claim
(the user id) from inside the verified token — never a user id sent separately
by the client.

Config (environment variables; see server/.env.example):
  SUPABASE_JWT_SECRET   HS256 signing secret
                        (Supabase Dashboard → Settings → API → JWT Secret).
  SUPABASE_PROJECT_REF  optional; used to validate the issuer.

If SUPABASE_JWT_SECRET is unset, auth is treated as "not configured":
require_user() will reject, but optional_user() returns None so the existing
unauthenticated /analyze flow keeps working for the demo.
"""
from __future__ import annotations

import os
from typing import Optional

import jwt  # PyJWT
from fastapi import Depends, Header, HTTPException, status

_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
_PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF")

# Supabase signs access tokens with HS256 and audience "authenticated".
_ALGORITHMS = ["HS256"]
_AUDIENCE = "authenticated"


def is_auth_configured() -> bool:
    return bool(_JWT_SECRET)


def _decode(token: str) -> dict:
    if not _JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Server auth not configured (SUPABASE_JWT_SECRET missing).",
        )
    try:
        claims = jwt.decode(
            token,
            _JWT_SECRET,
            algorithms=_ALGORITHMS,
            audience=_AUDIENCE,
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    if _PROJECT_REF:
        expected_iss = f"https://{_PROJECT_REF}.supabase.co/auth/v1"
        if claims.get("iss") and claims["iss"] != expected_iss:
            raise HTTPException(status_code=401, detail="Invalid token issuer")

    return claims


def _extract_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    return parts[1].strip() or None


def require_user(authorization: Optional[str] = Header(default=None)) -> dict:
    """Dependency for protected endpoints. Returns {id, email} or 401."""
    token = _extract_bearer(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    claims = _decode(token)
    return {"id": claims["sub"], "email": claims.get("email")}


def optional_user(authorization: Optional[str] = Header(default=None)) -> Optional[dict]:
    """Dependency that attaches the user if a valid token is present, else None.
    Lets the existing anonymous tracking flow continue to work."""
    token = _extract_bearer(authorization)
    if not token or not _JWT_SECRET:
        return None
    try:
        claims = _decode(token)
    except HTTPException:
        return None
    return {"id": claims["sub"], "email": claims.get("email")}
