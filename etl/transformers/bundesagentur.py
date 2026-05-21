from models.schemas import EmploymentRaw


def validate_rows(rows: list[EmploymentRaw]) -> list[EmploymentRaw]:
    """Deduplicate by AGS (keep last occurrence) and drop rows with no AGS."""
    seen: dict[str, EmploymentRaw] = {}
    for row in rows:
        if row.ags and len(row.ags) == 5:
            seen[row.ags] = row
    return list(seen.values())
