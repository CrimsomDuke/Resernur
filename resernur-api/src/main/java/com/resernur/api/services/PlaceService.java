package com.resernur.api.services;

import com.resernur.api.dtos.PlaceImageResponseDTO;
import com.resernur.api.models.Place;
import com.resernur.api.models.PlaceImage;
import com.resernur.api.repositories.PlaceImageRepository;
import com.resernur.api.repositories.PlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PlaceService {
    @Autowired
    private PlaceRepository placeRepository;
    @Autowired
    private PlaceImageRepository placeImageRepository;

    @Value("${media.images.path}")
    private String imagesPath;

    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    public Optional<Place> getPlaceById(int id) {
        return placeRepository.findById(id);
    }

    public Place savePlace(Place place) {
        return placeRepository.save(place);
    }

    public void deletePlaceById(int id) {
        placeRepository.deleteById(id);
    }

    public List<PlaceImageResponseDTO> uploadImages(int placeId, List<MultipartFile> images) throws IOException {
        Optional<Place> placeOpt = placeRepository.findById(placeId);
        if (placeOpt.isEmpty()) throw new IllegalArgumentException("Place not found");
        Place place = placeOpt.get();
        List<PlaceImageResponseDTO> responseList = new ArrayList<>();
        for (MultipartFile image : images) {
            String filename = UUID.randomUUID() + "_" + image.getOriginalFilename();
            Path filePath = Paths.get(imagesPath, filename);
            Files.createDirectories(filePath.getParent());
            image.transferTo(filePath.toFile());
            PlaceImage placeImage = new PlaceImage();
            placeImage.setPlace(place);
            placeImage.setFilePath(filename);
            placeImage = placeImageRepository.save(placeImage);
            PlaceImageResponseDTO dto = new PlaceImageResponseDTO();
            dto.setId(placeImage.getId());
            dto.setUrl("/api/places/images/" + filename);
            responseList.add(dto);
        }
        return responseList;
    }

    public void deleteImage(int imageId) throws IOException {
        Optional<PlaceImage> imgOpt = placeImageRepository.findById(imageId);
        if (imgOpt.isPresent()) {
            PlaceImage img = imgOpt.get();
            Path filePath = Paths.get(imagesPath, img.getFilePath());
            Files.deleteIfExists(filePath);
            placeImageRepository.deleteById(imageId);
        }
    }

    public List<PlaceImageResponseDTO> getImagesForPlace(int placeId) {
        List<PlaceImage> images = placeImageRepository.findAll();
        List<PlaceImageResponseDTO> dtos = new ArrayList<>();
        for (PlaceImage img : images) {
            if (img.getPlace().getId() == placeId) {
                PlaceImageResponseDTO dto = new PlaceImageResponseDTO();
                dto.setId(img.getId());
                dto.setUrl("/api/places/images/" + img.getFilePath());
                dtos.add(dto);
            }
        }
        return dtos;
    }
}