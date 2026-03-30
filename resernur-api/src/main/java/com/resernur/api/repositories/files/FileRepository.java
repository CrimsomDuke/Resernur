package com.resernur.api.repositories.files;

import com.resernur.api.models.files.File;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<File, Integer> {
}
