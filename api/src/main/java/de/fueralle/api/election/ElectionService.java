package de.fueralle.api.election;

import de.fueralle.api.config.GlobalExceptionHandler.DataNotReadyException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ElectionService {

    private final ElectionRepository repository;

    public ElectionService(ElectionRepository repository) {
        this.repository = repository;
    }

    public ElectionDTO getByAgs(String ags) {
        if (repository.count() == 0) {
            throw new DataNotReadyException("election_current table is empty — ETL has not run yet");
        }
        Integer constituencyNr = repository.findConstituencyNrForAgs(ags)
                .or(() -> repository.findConstituencyNrByDistrictName(ags))
                .orElseThrow(() -> new DataNotReadyException("No constituency mapping found for AGS: " + ags));
        ElectionRow row = repository.findByConstituencyNr(constituencyNr)
                .orElseThrow(() -> new DataNotReadyException("No election data found for constituency: " + constituencyNr));
        List<String> agsList = repository.findAgsForConstituency(constituencyNr);
        return toDTO(row, agsList);
    }

    private ElectionDTO toDTO(ElectionRow row, List<String> agsList) {
        return new ElectionDTO(
                row.constituencyNr(),
                row.constituencyName(),
                row.electionYear(),
                row.turnout(),
                row.spd(),
                row.cduCsu(),
                row.greens(),
                row.fdp(),
                row.afd(),
                row.leftParty(),
                row.other(),
                row.dataDate(),
                agsList
        );
    }
}
