package com.app.myorbit.categories.api;

import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.NotFoundException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {
    private static final String AUTH = "Bearer token-u1";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CategoryService categoryService;

    @MockitoBean
    private CurrentUserProvider currentUserProvider;

    @BeforeEach
    void authenticate() {
        User user = new User();
        user.setId("u1");
        when(currentUserProvider.requireUser(AUTH)).thenReturn(user);
        when(currentUserProvider.requireUser(null)).thenThrow(new UnauthorizedException("Sesion invalida"));
    }

    private Category category() {
        Category category = new Category();
        category.setId("c1");
        category.setUserId("u1");
        category.setName("Gym");
        category.setColor("#2E90FA");
        return category;
    }

    @Test
    void updateReturnsTheEditedCategory() throws Exception {
        when(categoryService.update(eq("u1"), eq("c1"), any(UpdateCategoryRequest.class))).thenReturn(category());

        mockMvc.perform(put("/api/categories/c1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Gym\",\"color\":\"#2E90FA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("c1"))
                .andExpect(jsonPath("$.name").value("Gym"))
                .andExpect(jsonPath("$.color").value("#2E90FA"));
    }

    @Test
    void updateRejectsBlankNameAndInvalidColor() throws Exception {
        mockMvc.perform(put("/api/categories/c1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/categories/c1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Gym\",\"color\":\"rojo\"}"))
                .andExpect(status().isBadRequest());
        verify(categoryService, never()).update(any(), any(), any());
    }

    @Test
    void updateWithDuplicatedNameIsRejected() throws Exception {
        when(categoryService.update(eq("u1"), eq("c1"), any(UpdateCategoryRequest.class)))
                .thenThrow(new BusinessRuleException("Ya existe una categoria con ese nombre"));

        mockMvc.perform(put("/api/categories/c1").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Proyecto\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void updateOfMissingCategoryIsNotFound() throws Exception {
        when(categoryService.update(eq("u1"), eq("x"), any(UpdateCategoryRequest.class)))
                .thenThrow(new NotFoundException("Categoría no encontrada"));

        mockMvc.perform(put("/api/categories/x").header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Gym\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteRespondsNoContent() throws Exception {
        mockMvc.perform(delete("/api/categories/c1").header("Authorization", AUTH))
                .andExpect(status().isNoContent());

        verify(categoryService).delete("u1", "c1");
    }

    @Test
    void deleteOfMissingCategoryIsNotFound() throws Exception {
        doThrow(new NotFoundException("Categoría no encontrada")).when(categoryService).delete("u1", "x");

        mockMvc.perform(delete("/api/categories/x").header("Authorization", AUTH))
                .andExpect(status().isNotFound());
    }

    @Test
    void requestsWithoutSessionAreUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/categories/c1")).andExpect(status().isUnauthorized());
    }
}
