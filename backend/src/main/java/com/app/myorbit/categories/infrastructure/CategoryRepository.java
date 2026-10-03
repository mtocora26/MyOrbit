package com.app.myorbit.categories.infrastructure;

import com.app.myorbit.categories.domain.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUserIdOrderByNameAsc(String userId);
}
