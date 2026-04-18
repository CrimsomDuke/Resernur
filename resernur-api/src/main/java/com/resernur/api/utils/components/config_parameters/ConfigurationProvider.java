package com.resernur.api.utils.components.config_parameters;

import com.resernur.api.models.system.ConfigParameter;
import com.resernur.api.repositories.configuration_parameters.ConfigParameterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConfigurationProvider {
    private final ConfigParameterRepository repository;

    public int getInt(String key) {
        return Integer.parseInt(repository.findByParamKey(key)
                .getParamValue());
    }

    public String getString(String key) {
        return repository.findByParamKey(key)
                .getParamValue();
    }

    public boolean saveParam(String key, String value){
        ConfigParameter existing = repository.findByParamKey(key);
        if(existing != null){
            existing.setParamValue(value);
            repository.save(existing);
        } else {
            ConfigParameter newParam = new ConfigParameter();
            newParam.setParamKey(key);
            newParam.setParamValue(value);
            repository.save(newParam);
        }
        return true;
    }
}
