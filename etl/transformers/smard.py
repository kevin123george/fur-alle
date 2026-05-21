from models.schemas import EnergyRaw


def validate_rows(rows: list[EnergyRaw]) -> list[EnergyRaw]:
    """Filter out rows with obvious data issues."""
    valid = []
    for row in rows:
        if row.mwh_quarter is not None and row.mwh_quarter < 0:
            continue
        valid.append(row)
    return valid
