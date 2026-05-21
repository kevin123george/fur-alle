package de.fueralle.api.election;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Table("election_current")
public record ElectionRow(
        @Id Long id,
        @Column("constituency_nr") Integer constituencyNr,
        @Column("constituency_name") String constituencyName,
        @Column("election_year") Integer electionYear,
        @Column("turnout") BigDecimal turnout,
        @Column("spd") BigDecimal spd,
        @Column("cdu_csu") BigDecimal cduCsu,
        @Column("greens") BigDecimal greens,
        @Column("fdp") BigDecimal fdp,
        @Column("afd") BigDecimal afd,
        @Column("left_party") BigDecimal leftParty,
        @Column("other") BigDecimal other,
        @Column("data_date") LocalDate dataDate
) {}
