package com.resernur.api.dtos.places;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Data
public class PlaceImageUploadDTO {
    private List<MultipartFile> images;
    // Getters and setters
}
