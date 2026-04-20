package com.resernur.api.repositories.configuration_parameters;


import com.resernur.api.models.system.ConfigParameter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigParameterRepository extends JpaRepository<ConfigParameter, Integer> {
    ConfigParameter findByParamKey(String paramKey);
}
