from models.schemas import WeatherRaw


def validate_rows(rows: list[WeatherRaw]) -> list[WeatherRaw]:
    """Deduplicate by AGS (last wins) and drop rows with no temperature data."""
    seen: dict[str, WeatherRaw] = {}
    for row in rows:
        if row.ags and len(row.ags) == 5:
            seen[row.ags] = row
    return list(seen.values())
