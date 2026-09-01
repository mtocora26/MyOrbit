package com.app.MyOrbit.categories;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUserIdOrderByNameAsc(String userId);
}
