package com.resernur.api.configurations;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);

    @Value("${media.files.path}")
    private String mediaFilesPath;

    @Value("${media.images.path:}")
    private String mediaImagesPath;

    @PostConstruct
    public void init() {
        String path = (mediaImagesPath != null && !mediaImagesPath.isBlank()) ? mediaImagesPath : mediaFilesPath;
        if (path == null) {
            log.warn("No media.images.path or media.files.path configured; image serving disabled.");
            return;
        }
        // Normalizar separador y asegurar slash final
        path = path.replace("\\", "/");
        if (!path.endsWith("/")) {
            path = path + "/";
        }

        // Intentar crear la carpeta si no existe
        try {
            // Convertir a ruta del SO
            String osPath = path.replace("/", FileSystems.getDefault().getSeparator());
            Path dir = Paths.get(osPath);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
                log.info("Created media images directory: {}", dir.toAbsolutePath());
            } else {
                log.info("Media images directory exists: {}", dir.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Unable to create media images directory for path='{}'", path, e);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Asegurarnos de tener una ruta válida y con slash final
        String path = (mediaImagesPath != null && !mediaImagesPath.isBlank()) ? mediaImagesPath : mediaFilesPath;
        if (path == null) {
            return; // no hay ruta configurada
        }
        // Normalizar separador y asegurar slash final
        path = path.replace("\\", "/");
        if (!path.endsWith("/")) {
            path = path + "/";
        }
        String location = "file:///" + path; // Added extra slashes for Windows
        log.info("Mapping /media/** to physical location: {}", location);

        registry.addResourceHandler("/media/**")
                .addResourceLocations(location);
    }
}
