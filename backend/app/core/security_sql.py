"""Security utilities for SQL query parameterization and escaping."""

def escape_like_term(term: str) -> str:
    """Escapes special SQL LIKE/ILIKE wildcard characters (backslash, percent, underscore).
    
    Prevents SQL LIKE Wildcard Injection where user input containing '%', '_', or '\\'
    could alter query matching logic or trigger unindexed pattern scans.
    """
    if not term:
        return ""
    # Backslash must be escaped first so we don't double-escape the subsequent backslashes
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
