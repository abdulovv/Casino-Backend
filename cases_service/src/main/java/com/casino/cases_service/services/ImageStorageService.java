package com.casino.cases_service.services;

import com.casino.cases_service.exceptions.ImageNotFoundException;
import com.casino.cases_service.exceptions.ImageStorageException;
import com.casino.cases_service.exceptions.InvalidImageException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {
    private static final Map<String, String> EXTENSIONS = Map.of(
            MediaType.IMAGE_JPEG_VALUE, ".jpg",
            MediaType.IMAGE_PNG_VALUE, ".png",
            "image/webp", ".webp"
    );

    private final Path imagesDirectory;
    private final String publicBaseUrl;

    public ImageStorageService(
            @Value("${storage.images-directory}") String imagesDirectory,
            @Value("${storage.public-base-url}") String publicBaseUrl
    ) {
        this.imagesDirectory = Path.of(imagesDirectory).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl;
        try {
            Files.createDirectories(this.imagesDirectory);
        } catch (IOException exception) {
            throw new ImageStorageException(
                    "Cannot create case images directory",
                    exception
            );
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Image file is empty");
        }

        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw new InvalidImageException(
                    "Only JPEG, PNG and WebP images are allowed"
            );
        }

        String fileName = UUID.randomUUID() + extension;
        Path target = imagesDirectory.resolve(fileName).normalize();
        if (!target.getParent().equals(imagesDirectory)) {
            throw new InvalidImageException("Invalid image file name");
        }

        try {
            Files.copy(
                    file.getInputStream(),
                    target,
                    StandardCopyOption.REPLACE_EXISTING
            );
        } catch (IOException exception) {
            throw new ImageStorageException("Cannot store case image", exception);
        }

        return publicBaseUrl + "/" + fileName;
    }

    public Resource load(String fileName) {
        if (fileName == null || !fileName.matches(
                "[0-9a-fA-F-]+\\.(jpg|png|webp)"
        )) {
            throw new ImageNotFoundException();
        }

        Path file = imagesDirectory.resolve(fileName).normalize();
        if (!file.getParent().equals(imagesDirectory) || !Files.isRegularFile(file)) {
            throw new ImageNotFoundException();
        }

        try {
            return new UrlResource(file.toUri());
        } catch (MalformedURLException exception) {
            throw new ImageNotFoundException();
        }
    }

    public MediaType contentType(String fileName) {
        if (fileName.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        }
        if (fileName.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        }
        return MediaType.IMAGE_JPEG;
    }
}
