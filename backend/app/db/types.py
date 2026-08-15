"""Column types shared across the models."""

from sqlalchemy import Uuid


class GUID(Uuid):
    """Dialect-agnostic UUID column.

    The models used `sqlalchemy.dialects.postgresql.UUID`, which emits the
    literal type name "UUID" on every dialect. SQLite has no UUID type, and its
    affinity rules fall through to NUMERIC for any declaration it does not
    recognise — so a hex value made only of digits was coerced to an integer on
    write, and then crashed `uuid.UUID()` on the way back out. One request
    carrying 00000000-0000-0000-0000-000000000000 was enough to make every
    later read of that table return 500, permanently.

    `sqlalchemy.Uuid` emits CHAR(32) on SQLite — TEXT affinity, no coercion —
    and the native UUID type on PostgreSQL. The stored value is the same 32
    character hex string either way, so existing rows keep working.
    """

    def __init__(self, **kwargs):
        kwargs.setdefault("as_uuid", True)
        super().__init__(**kwargs)
