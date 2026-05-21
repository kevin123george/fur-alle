package de.fueralle.api.election;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface ElectionRepository extends Repository<ElectionRow, Long> {

    @Query("SELECT id, constituency_nr, constituency_name, election_year, turnout, " +
           "spd, cdu_csu, greens, fdp, afd, left_party, other, data_date " +
           "FROM election_current WHERE constituency_nr = :nr")
    Optional<ElectionRow> findByConstituencyNr(Integer nr);

    @Query("SELECT ags FROM wahlkreis_ags_map WHERE constituency_nr = :nr ORDER BY ags")
    List<String> findAgsForConstituency(Integer nr);

    @Query("SELECT constituency_nr FROM wahlkreis_ags_map WHERE ags = :ags LIMIT 1")
    Optional<Integer> findConstituencyNrForAgs(String ags);

    // Fallback: match constituency name against the base district name (before any comma).
    // Stripping ", kreisfreie Stadt" / ", Stadt" etc. lets "Pirmasens, kreisfreie Stadt"
    // match the constituency "Pirmasens". Pick shortest match to prefer the most specific.
    @Query("SELECT e.constituency_nr FROM election_current e " +
           "JOIN demographics_current d ON d.ags = :ags " +
           "WHERE e.constituency_name ILIKE '%' || trim(split_part(d.district_name, ',', 1)) || '%' " +
           "ORDER BY length(e.constituency_name) ASC LIMIT 1")
    Optional<Integer> findConstituencyNrByDistrictName(String ags);

    @Query("SELECT count(*) FROM election_current")
    long count();
}
