package de.fueralle.api.energy;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EnergyService {

    private static final Map<Integer, String> FILTER_NAMES = Map.of(
            410,  "Netzlast gesamt",
            4068, "Photovoltaik",
            4067, "Wind Onshore",
            1225, "Wind Offshore",
            4066, "Biomasse"
    );

    private final EnergyRepository repository;

    public EnergyService(EnergyRepository repository) {
        this.repository = repository;
    }

    public List<EnergyDTO> getLatest24Hours() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("energy_current table is empty — ETL has not run yet");
        }
        return toDTO(repository.findLast24Hours());
    }

    public List<EnergyDTO> getCurrentSnapshot() {
        if (repository.count() == 0) {
            throw new DataNotReadyException("energy_current table is empty — ETL has not run yet");
        }
        return toDTO(repository.findLatestPerFilter());
    }

    private List<EnergyDTO> toDTO(List<EnergyRow> rows) {
        return rows.stream()
                .collect(Collectors.groupingBy(EnergyRow::filterCode))
                .entrySet().stream()
                .map(entry -> {
                    int code = entry.getKey();
                    List<EnergyRow> group = entry.getValue();
                    var dataDate = group.stream()
                            .map(EnergyRow::dataDate)
                            .max(java.time.LocalDate::compareTo)
                            .orElseThrow();
                    var series = group.stream()
                            .map(r -> new EnergyDTO.EnergyPoint(r.tsUtc(), r.mwhQuarter(), r.mwInstant()))
                            .sorted(java.util.Comparator.comparing(EnergyDTO.EnergyPoint::tsUtc))
                            .toList();
                    return new EnergyDTO(code, FILTER_NAMES.getOrDefault(code, "Unbekannt"), series, dataDate);
                })
                .sorted(java.util.Comparator.comparingInt(EnergyDTO::filterCode))
                .toList();
    }
}
