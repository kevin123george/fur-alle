package de.fueralle.api.election;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ElectionDTO(
        Integer constituencyNr,
        String constituencyName,
        Integer electionYear,
        BigDecimal turnout,
        BigDecimal spd,
        BigDecimal cduCsu,
        BigDecimal greens,
        BigDecimal fdp,
        BigDecimal afd,
        BigDecimal leftParty,
        BigDecimal other,
        LocalDate dataDate,
        List<String> ags
) {}
