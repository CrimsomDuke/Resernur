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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlaceImageService {

    @Autowired
    private PlaceRepository placeRepository;

    @Autowired
    private PlaceImageRepository placeImageRepository;

    @Value("${media.images.path}")
    private String imagesPath;

    @Value("${app.public-url:}")
    private String publicUrlBase;

    @Value("${media.endpoint:media}")
    private String mediaEndpoint;

    private static final long MAX_IMAGE_SIZE = 5L * 1024L * 1024L; // 5 MB

    public List<PlaceImageResponseDTO> uploadImages(int placeId, List<MultipartFile> images) throws IOException {
        Optional<Place> placeOpt = placeRepository.findById(placeId);
        if (placeOpt.isEmpty()) throw new IllegalArgumentException("Place not found");
        Place place = placeOpt.get();
        List<PlaceImageResponseDTO> responseList = new ArrayList<>();

        for (MultipartFile image : images) {
            validateImage(image);

            String original = Optional.ofNullable(image.getOriginalFilename()).orElse("file");
            String sanitized = Paths.get(original).getFileName().toString(); // evita rutas
            String ext = getExtension(sanitized);
            String filename = UUID.randomUUID().toString() + (ext.isEmpty() ? "" : "." + ext);

            String relativePath = String.join("/", Arrays.asList("places", String.valueOf(placeId), filename));

            Path filePath = Paths.get(imagesPath, "places", String.valueOf(placeId), filename);
            Files.createDirectories(filePath.getParent());
            image.transferTo(filePath.toFile());

            PlaceImage placeImage = new PlaceImage();
            placeImage.setPlace(place);
            placeImage.setFilePath(relativePath);

            placeImage = placeImageRepository.save(placeImage);

            PlaceImageResponseDTO dto = new PlaceImageResponseDTO();
            dto.setId(placeImage.getId());
            dto.setUrl(buildPublicUrl(relativePath));
            responseList.add(dto);
        }
        return responseList;
    }

    public boolean deleteImage(int imageId) throws IOException {
        Optional<PlaceImage> imgOpt = placeImageRepository.findById(imageId);
        if (imgOpt.isPresent()) {
            PlaceImage img = imgOpt.get();
            Path filePath = Paths.get(imagesPath, img.getFilePath().replace("/", java.io.File.separator));
            Files.deleteIfExists(filePath);
            placeImageRepository.deleteById(imageId);
            return true;
        }
        return false;
    }

    public List<PlaceImageResponseDTO> getImagesForPlace(int placeId) {
        List<PlaceImage> images = placeImageRepository.findByPlace_Id(placeId);
        return images.stream()
                .map(img -> {
                    PlaceImageResponseDTO dto = new PlaceImageResponseDTO();
                    dto.setId(img.getId());
                    dto.setUrl(buildPublicUrl(img.getFilePath()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // Helpers
    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) throw new IllegalArgumentException("Empty file");
        if (image.getSize() > MAX_IMAGE_SIZE) throw new IllegalArgumentException("File too large");
        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) throw new IllegalArgumentException("Invalid file type");
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx <= 0 || idx == filename.length() - 1) return "";
        return filename.substring(idx + 1);
    }

    private String buildPublicUrl(String relativePath) {
        String normalized = relativePath.replace("\\", "/");
        if (publicUrlBase != null && !publicUrlBase.isBlank()) {
            String base = publicUrlBase.endsWith("/") ? publicUrlBase.substring(0, publicUrlBase.length()-1) : publicUrlBase;
            return base + "/" + mediaEndpoint + "/" + normalized;
        }
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/" + mediaEndpoint + "/")
                .path(normalized)
                .toUriString();
    }
}
