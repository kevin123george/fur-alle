from models.schemas import AirQualityRaw


def validate_rows(rows: list[AirQualityRaw]) -> list[AirQualityRaw]:
    """Deduplicate by AGS (last wins) and drop rows with no measurements."""
    seen: dict[str, AirQualityRaw] = {}
    for row in rows:
        if row.ags and len(row.ags) == 5:
            if any(v is not None for v in (row.pm10, row.no2, row.o3, row.pm25)):
                seen[row.ags] = row
    return list(seen.values())
