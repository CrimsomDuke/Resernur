package com.resernur.api.services.files;

import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.files.File;
import com.resernur.api.repositories.files.FileRepository;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

@Service
public class FileService {

    @Value("${media.files.path:}")
    private String filesPath;

    @Value("${app.public-url:}")
    private String publicUrlBase;

    @Value("${media.endpoint:media}")
    private String mediaEndpoint;

    @Autowired
    private FileRepository fileRepository;

    private static final long MAX_IMAGE_SIZE = 50L * 1024L * 1024L;

    public StandardResult<File> saveFile(MultipartFile fileData) throws IOException {

        try{
            validateFile(fileData);
        }catch (IllegalArgumentException e){
            return new StandardResult<>(false, "Invalid file: " + e.getMessage(), null);
        }

        String original = Optional.ofNullable(fileData.getOriginalFilename()).orElse("file");
        String sanitized = original.replaceAll("[^a-zA-Z0-9\\.\\-_]", "_");
        String ext = getExtension(sanitized);
        String baseName = sanitized;
        if (!ext.isEmpty()) {
            baseName = sanitized.substring(0, sanitized.length() - (ext.length() + 1));
        }
        String unique = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        String filename = unique + "_" + baseName + (ext.isEmpty() ? "" : ("." + ext));

        Path dir = Paths.get(filesPath);
        Files.createDirectories(dir);
        Path target = dir.resolve(filename);

        //guardar pal disk
        fileData.transferTo(target.toFile());

        File fileEntity = new File();
        fileEntity.setFilePath(filename);

        File saved = fileRepository.save(fileEntity);

        return new StandardResult<>(true, "", saved);
    }

    public StandardResult<File> getFileById(int id) {
        Optional<File> fileRes = fileRepository.findById(id);
        if(fileRes.isEmpty()) {
            return new StandardResult<>(false, "File not found", null);
        }

        return new StandardResult<>(true, "", fileRes.get());
    }

    private void validateFile(MultipartFile fileData) throws IllegalArgumentException {
        if (fileData == null || fileData.isEmpty()) {
           throw new IllegalArgumentException("No file provided");
        }

        if (filesPath == null || filesPath.isBlank()) {
            throw new IllegalArgumentException("Server is not configured for file storage (media.files.path)");
        }

        if (fileData.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("File is too large (max 5MB)");
        }
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        if (idx <= 0 || idx == filename.length() - 1) return "";
        return filename.substring(idx + 1);
    }
}
