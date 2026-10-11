"""Email verification: 6-digit codes with expiry.

Production delivery is SMTP (configure); with DEV_MAILBOX=true (local demo)
the latest code is fetchable via GET /auth/dev-inbox so the flow is testable
end-to-end without a mail server.
"""

import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import current_user, require_member
from ..models import EmailToken, User

router = APIRouter(prefix="/auth", tags=["auth-verify"])

CODE_TTL_MIN = 15


class ConfirmIn(BaseModel):
    code: str = Field(min_length=4, max_length=10)


def _issue(db: Session, user: User) -> EmailToken:
    db.query(EmailToken).filter(EmailToken.owner_id == user.id, EmailToken.used == False).update({"used": True})  # noqa: E712
    code = f"{secrets.randbelow(900000) + 100000}"
    tok = EmailToken(owner_id=user.id, code=code,
                     expires_at=datetime.now(timezone.utc) + timedelta(minutes=CODE_TTL_MIN))
    db.add(tok)
    db.commit()
    db.refresh(tok)
    return tok


def _check(db: Session, user: User, code: str) -> EmailToken | None:
    tok = (
        db.query(EmailToken)
        .filter(EmailToken.owner_id == user.id, EmailToken.used == False)  # noqa: E712
        .order_by(EmailToken.created_at.desc())
        .first()
    )
    if not tok:
        return None
    exp = tok.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < datetime.now(timezone.utc):
        return None
    if tok.code != code.strip():
        return None
    return tok


@router.post("/request-code")
def request_code(user: User = Depends(require_member), db: Session = Depends(get_db)):
    if user.email_verified:
        return {"sent": False, "verified": True}
    tok = _issue(db, user)
    # TODO production: send `tok.code` via SMTP to user.email here.
    out: dict = {"sent": True, "expires_minutes": CODE_TTL_MIN}
    if settings.DEV_MAILBOX:
        out["dev_code"] = tok.code
    return out


@router.post("/confirm-code")
def confirm_code(body: ConfirmIn, user: User = Depends(require_member), db: Session = Depends(get_db)):
    tok = _check(db, user, body.code)
    if not tok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code.")
    tok.used = True
    user.email_verified = True
    db.commit()
    return {"verified": True}


@router.get("/dev-inbox")
def dev_inbox(user: User = Depends(current_user), db: Session = Depends(get_db)):
    if not settings.DEV_MAILBOX:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dev mailbox disabled.")
    tok = (
        db.query(EmailToken)
        .filter(EmailToken.owner_id == user.id, EmailToken.used == False)  # noqa: E712
        .order_by(EmailToken.created_at.desc())
        .first()
    )
    if not tok:
        raise HTTPException(status_code=404, detail="No active code — request one first.")
    return {"code": tok.code, "expires_at": tok.expires_at.isoformat(), "email": user.email}
