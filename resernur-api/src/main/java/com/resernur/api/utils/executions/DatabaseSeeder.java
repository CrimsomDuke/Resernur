package com.resernur.api.utils.executions;

import com.resernur.api.models.system.ConfigParameter;
import com.resernur.api.repositories.configuration_parameters.ConfigParameterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final ConfigParameterRepository repository;

    @Override
    public void run(String... args) {
        seedConfigParameters();
    }

    private void seedConfigParameters() {
        // Define your default rules here
        Map<String, String> defaultParams = Map.of(
                "OPENING_TIME", "07:00",
                "CLOSING_TIME", "22:00",
                "MAX_RESERVATION_HOURS", "8",
                "MIN_ADVANCE_DAYS", "2"
        );

        defaultParams.forEach((key, value) -> {
            if (repository.findByParamKey(key) == null) {
                ConfigParameter param = new ConfigParameter();
                param.setParamKey(key);
                param.setParamValue(value);
                repository.save(param);
                System.out.println("Seeded parameter: " + key);
            }
        });
    }
}
