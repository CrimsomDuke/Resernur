package com.resernur.api.utils.executions;

<<<<<<< HEAD
import com.resernur.api.models.system.ConfigParameter;
import com.resernur.api.repositories.configuration_parameters.ConfigParameterRepository;
=======
import com.resernur.api.dtos.auth.RegisterDTO;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.system.ConfigParameter;
import com.resernur.api.repositories.configuration_parameters.ConfigParameterRepository;
import com.resernur.api.services.security.AuthService;
>>>>>>> origin/slave
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

<<<<<<< HEAD
=======
import java.sql.SQLException;
>>>>>>> origin/slave
import java.util.Map;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final ConfigParameterRepository repository;
<<<<<<< HEAD

    @Override
    public void run(String... args) {
        seedConfigParameters();
    }

=======
    private final AuthService authService;

    @Override
    public void run(String... args) {
        seedUsers();
        seedConfigParameters();
    }

    private void seedUsers(){
        try{
            var dto = new RegisterDTO();
            dto.setFullName("Admin Admin");
            dto.setPassword("admin!123");
            dto.setEmail("admin@admin.com");
            dto.setRole(UserRole.ADMINISTRADOR);
            authService.register(dto);
        }catch (Exception ex){
            System.err.println("Error seeding users: " + ex.getMessage());
        }
    }

>>>>>>> origin/slave
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
