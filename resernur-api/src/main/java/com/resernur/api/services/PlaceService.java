package com.resernur.api.services;

import com.resernur.api.dtos.PlaceDTO;
import com.resernur.api.dtos.PlaceImageResponseDTO;
import com.resernur.api.models.Place;
import com.resernur.api.models.PlaceImage;
import com.resernur.api.repositories.PlaceImageRepository;
import com.resernur.api.repositories.PlaceRepository;
import com.resernur.api.repositories.users.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlaceService {
    @Autowired
    private PlaceRepository placeRepository;
    @Autowired
    private PlaceImageRepository placeImageRepository;
    @Autowired
    private UserRepository userRepository;

    @Value("${media.images.path}")
    private String imagesPath;

    // CRUD OPERATIONS
    public List<PlaceDTO> getAllPlaces() {
        return placeRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Optional<PlaceDTO> getPlaceById(int id) {
        return placeRepository.findById(id).map(this::toDTO);
    }

    public PlaceDTO createPlace(PlaceDTO dto) {
        Place place = new Place();
        place.setName(dto.getName());
        place.setDescription(dto.getDescription());
        place.setCapacity(dto.getCapacity());
        place.setStatus(com.resernur.api.models.enums.PlaceStatus.AVAILABLE);
        // Asignar usuario responsable
        userRepository.findById((long) dto.getUserInChargeId()).ifPresent(place::setUserInCharge);
        return toDTO(placeRepository.save(place));
    }

    public Optional<PlaceDTO> updatePlace(int id, PlaceDTO dto) {
        return placeRepository.findById(id).map(place -> {
            place.setName(dto.getName());
            place.setDescription(dto.getDescription());
            place.setCapacity(dto.getCapacity());
            // Asignar usuario responsable
            userRepository.findById((long) dto.getUserInChargeId()).ifPresent(place::setUserInCharge);
            return toDTO(placeRepository.save(place));
        });
    }

    public boolean deletePlaceById(int id) {
        if (placeRepository.existsById(id)) {
            placeRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // IMAGE OPERATIONS
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

    public boolean deleteImage(int imageId) throws IOException {
        Optional<PlaceImage> imgOpt = placeImageRepository.findById(imageId);
        if (imgOpt.isPresent()) {
            PlaceImage img = imgOpt.get();
            Path filePath = Paths.get(imagesPath, img.getFilePath());
            Files.deleteIfExists(filePath);
            placeImageRepository.deleteById(imageId);
            return true;
        }
        return false;
    }

    public List<PlaceImageResponseDTO> getImagesForPlace(int placeId) {
        List<PlaceImage> images = placeImageRepository.findAll();
        return images.stream()
                .filter(img -> img.getPlace().getId() == placeId)
                .map(img -> {
                    PlaceImageResponseDTO dto = new PlaceImageResponseDTO();
                    dto.setId(img.getId());
                    dto.setUrl("/api/places/images/" + img.getFilePath());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // DTO MAPPING
    private PlaceDTO toDTO(Place place) {
        PlaceDTO dto = new PlaceDTO();
        dto.setName(place.getName());
        dto.setDescription(place.getDescription());
        dto.setCapacity(place.getCapacity());
        if (place.getUserInCharge() != null) {
            dto.setUserInChargeId(place.getUserInCharge().getId().intValue());
        }
        return dto;
    }
}