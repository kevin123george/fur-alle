package de.fueralle.api.requests;

import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

import java.util.List;
import java.util.Optional;

public interface KreisRequestRepository extends Repository<KreisRequestRow, Long> {

    @Query("SELECT id, ags, kreis_name, state, request_count " +
           "FROM kreis_requests ORDER BY request_count DESC LIMIT 10")
    List<KreisRequestRow> findTop10();

    @Query("SELECT id, ags, kreis_name, state, request_count " +
           "FROM kreis_requests WHERE ags = :ags")
    Optional<KreisRequestRow> findByAgs(String ags);

    @Modifying
    @Query("INSERT INTO kreis_requests (ags, kreis_name, state, request_count) " +
           "VALUES (:ags, :districtName, :state, 1) " +
           "ON CONFLICT (ags) DO UPDATE SET request_count = kreis_requests.request_count + 1, updated_at = now()")
    void upsert(String ags, String districtName, String state);
}
