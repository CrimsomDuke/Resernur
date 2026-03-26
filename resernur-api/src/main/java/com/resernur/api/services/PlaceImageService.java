
package com.resernur.api.services;

import com.resernur.api.models.PlaceImage;
import com.resernur.api.repositories.PlaceImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlaceImageService {

    @Autowired
    private PlaceImageRepository placeImageRepository;

    public List<PlaceImage> getAllImages() {
        return placeImageRepository.findAll();
    }

    public Optional<PlaceImage> getImageById(int id) {
        return placeImageRepository.findById(id);
    }

    public PlaceImage saveImage(PlaceImage placeImage) {
        return placeImageRepository.save(placeImage);
    }

    public void deleteImageById(int id) {
        placeImageRepository.deleteById(id);
    }
}
