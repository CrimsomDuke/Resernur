package com.resernur.api.unittest.services.files;

import com.resernur.api.dtos.pojos.StandardResult;
import com.resernur.api.models.files.File;
import com.resernur.api.repositories.files.FileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FileServiceTests {
    @Mock
    private FileRepository fileRepository;
    @Mock
    private MultipartFile multipartFile;
    @InjectMocks
    private com.resernur.api.services.files.FileService fileService;

    @BeforeEach
    void setup() {
        try {
            //Obtener fields privados usando reflection, no puedo acceder a
            //estas weas porque son priv
            java.lang.reflect.Field filesPathField = fileService.getClass().getDeclaredField("filesPath");
            filesPathField.setAccessible(true);
            filesPathField.set(fileService, System.getProperty("java.io.tmpdir"));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void saveFile_Success() throws IOException {
        when(multipartFile.isEmpty()).thenReturn(false);
        when(multipartFile.getOriginalFilename()).thenReturn("test.png");
        when(multipartFile.getSize()).thenReturn(1024L);
        doNothing().when(multipartFile).transferTo(any(java.io.File.class));
        File fileEntity = new File();
        fileEntity.setId(1);
        fileEntity.setFilePath("test.png");
        when(fileRepository.save(any(File.class))).thenReturn(fileEntity);
        StandardResult<File> result = fileService.saveFile(multipartFile);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(fileEntity.getId(), result.getData().getId());
        verify(fileRepository, times(1)).save(any(File.class));
    }

    @Test
    void saveFile_InvalidFile() throws IOException {
        when(multipartFile.isEmpty()).thenReturn(true);
        StandardResult<File> result = fileService.saveFile(multipartFile);
        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("No file provided"));
        verify(fileRepository, never()).save(any());
    }

    @Test
    void getFileById_Success() {
        File fileEntity = new File();
        fileEntity.setId(2);
        fileEntity.setFilePath("file2.png");
        when(fileRepository.findById(eq(2))).thenReturn(Optional.of(fileEntity));
        StandardResult<File> result = fileService.getFileById(2);
        assertTrue(result.isSuccess());
        assertNotNull(result.getData());
        assertEquals(2, result.getData().getId());
        verify(fileRepository, times(1)).findById(eq(2));
    }

    @Test
    void getFileById_NotFound() {
        when(fileRepository.findById(eq(99))).thenReturn(Optional.empty());
        StandardResult<File> result = fileService.getFileById(99);
        assertFalse(result.isSuccess());
        assertNull(result.getData());
        assertTrue(result.getErrorMessage().contains("not found"));
        verify(fileRepository, times(1)).findById(eq(99));
    }
}
