package com.resernur.api.utils.tasks;

import com.resernur.api.models.enums.PlaceStatus;
import com.resernur.api.models.places.Place;
import com.resernur.api.repositories.places.PlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScheduledTasks {

    @Autowired
    private PlaceRepository placeRepository;

    @Scheduled(fixedRate = 2000)
    public void changePlacesStatusToAvailable(){
        List<Place> placesWithPastBookings = placeRepository.findAllPlacesWithPastBookings();
        for(Place place : placesWithPastBookings){
            place.setStatus(PlaceStatus.AVAILABLE);
        }
        placeRepository.saveAll(placesWithPastBookings);
    }

}
