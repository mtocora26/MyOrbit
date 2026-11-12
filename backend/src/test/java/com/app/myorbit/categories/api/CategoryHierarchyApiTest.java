package com.app.myorbit.categories.api;

import com.app.myorbit.categories.application.CategoryService;
import com.app.myorbit.categories.domain.Category;
import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
class CategoryHierarchyApiTest {
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

    private Category category(String id, String name, String parentId) {
        Category category = new Category();
        category.setId(id);
        category.setUserId("u1");
        category.setName(name);
        category.setColor("#7A5AF8");
        category.setParentId(parentId);
        return category;
    }

    @Test
    void listExposesTheParentOfEachCategory() throws Exception {
        when(categoryService.listByUser("u1")).thenReturn(List.of(category("uni", "Universidad", null), category("sem", "Semillero", "uni")));

        mockMvc.perform(get("/api/categories").header("Authorization", AUTH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parentId").doesNotExist())
                .andExpect(jsonPath("$[1].parentId").value("uni"));
    }

    @Test
    void createAcceptsAParentId() throws Exception {
        when(categoryService.create(eq("u1"), any(CreateCategoryRequest.class))).thenReturn(category("sem", "Semillero", "uni"));

        mockMvc.perform(post("/api/categories").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Semillero\",\"parentId\":\"uni\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.parentId").value("uni"));

        ArgumentCaptor<CreateCategoryRequest> captor = ArgumentCaptor.forClass(CreateCategoryRequest.class);
        verify(categoryService).create(eq("u1"), captor.capture());
        assertEquals("uni", captor.getValue().parentId());
    }

    @Test
    void updateDistinguishesAbsentFromEmptyParentId() throws Exception {
        when(categoryService.update(eq("u1"), eq("sem"), any(UpdateCategoryRequest.class))).thenReturn(category("sem", "Semillero", null));

        mockMvc.perform(put("/api/categories/sem").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Semillero\"}")).andExpect(status().isOk());
        mockMvc.perform(put("/api/categories/sem").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Semillero\",\"parentId\":\"\"}")).andExpect(status().isOk());

        ArgumentCaptor<UpdateCategoryRequest> captor = ArgumentCaptor.forClass(UpdateCategoryRequest.class);
        verify(categoryService, org.mockito.Mockito.times(2)).update(eq("u1"), eq("sem"), captor.capture());
        assertNull(captor.getAllValues().get(0).parentId());
        assertEquals("", captor.getAllValues().get(1).parentId());
    }

    @Test
    void hierarchyRuleViolationsAreBadRequest() throws Exception {
        when(categoryService.create(eq("u1"), any(CreateCategoryRequest.class)))
                .thenThrow(new BusinessRuleException("Solo se permite un nivel de subcategorias: Semillero ya es una subcategoria"));

        mockMvc.perform(post("/api/categories").header("Authorization", AUTH).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Reuniones\",\"parentId\":\"sem\"}"))
                .andExpect(status().isBadRequest());
    }
}
