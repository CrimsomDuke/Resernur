package com.resernur.api.controllers.system;

import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.utils.aspect.RequiresAnyRole;
import com.resernur.api.utils.components.config_parameters.ConfigurationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/configuration-params")
public class ConfigurationParametersController {

    @Autowired
    private  ConfigurationProvider configurationProvider;

    @PostMapping("/get/{key}")
    @RequiresAnyRole(roles = {"ADMINISTRADOR"})
    public ResponseEntity<StandardResult<String>> getParameterString(String key) {
        try {
            String value = configurationProvider.getString(key);
            StandardResult<String> res =  new StandardResult<>();
            res.setData(value);
            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            StandardResult<String> res =  new StandardResult<>();
            res.setSuccess(false);
            res.setErrorMessage(ex.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @PostMapping("/get-int/{key}")
    @RequiresAnyRole(roles = {"ADMINISTRADOR"})
    public ResponseEntity<StandardResult<Integer>> getParameterInt(String key) {
        try {
            Integer value = configurationProvider.getInt(key);
            StandardResult<Integer> res =  new StandardResult<>();
            res.setData(value);
            return ResponseEntity.ok(res);
        } catch (Exception ex) {
            StandardResult<Integer> res =  new StandardResult<>();
            res.setSuccess(false);
            res.setErrorMessage(ex.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }

    @PostMapping("/set/{key}/{value}")
    @RequiresAnyRole(roles = {"ADMINISTRADOR"})
    public ResponseEntity<Map<String, String>> setParameter(String key, String value){
        try {
            configurationProvider.saveParam(key, value);
            return ResponseEntity.ok(Map.of("message", "Parameter updated successfully"));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

}
