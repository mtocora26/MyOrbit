package com.app.myorbit.categories.infrastructure;

import com.app.myorbit.categories.domain.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUserIdOrderByNameAsc(String userId);

    Optional<Category> findByUserIdAndNameIgnoreCase(String userId, String name);

    /** Las subcategorías de una categoría. */
    List<Category> findByUserIdAndParentId(String userId, String parentId);
}
