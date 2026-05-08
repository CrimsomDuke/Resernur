package com.resernur.api.utils.components.places;

import com.resernur.api.dtos.exceptions.ResernurException;
import com.resernur.api.dtos.places.PlaceDTO;
import com.resernur.api.models.enums.UserRole;
import com.resernur.api.models.users.User;
import com.resernur.api.repositories.places.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class PlaceValidationComponent {

    public void validatePlaceUpdateData(PlaceDTO dto, PlaceRepository placeRepository, Optional<User> userOpt) {
        if(dto.getUserInChargeId() != 0 && userOpt.isEmpty()){
            throw new ResernurException("Usuario responsable no encontrado");
        }

        if(dto.getUserInChargeId() != 0 && userOpt.get().getRole() != UserRole.ENCARGADO
                || userOpt.get().getRole() == UserRole.ADMINISTRADOR){
            throw new ResernurException("El usuario responsable debe tener el rol de ENCARGADO o ADMINISTRADOR");
        }
    }

}
