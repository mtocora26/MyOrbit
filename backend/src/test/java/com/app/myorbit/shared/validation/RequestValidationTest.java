package com.app.myorbit.shared.validation;

import com.app.myorbit.categories.api.CreateCategoryRequest;
import com.app.myorbit.habits.api.CreateHabitRequest;
import com.app.myorbit.tasks.api.CreateSubtaskRequest;
import com.app.myorbit.tasks.api.CreateTaskRequest;
import com.app.myorbit.users.api.LoginRequest;
import com.app.myorbit.users.api.RegisterRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private <T> List<String> messages(T request) {
        Set<ConstraintViolation<T>> violations = validator.validate(request);
        return violations.stream().map(ConstraintViolation::getMessage).sorted().toList();
    }

    @Test
    void validRegisterHasNoViolations() {
        assertTrue(messages(new RegisterRequest("Ana", "ana@uni.edu", "12345678")).isEmpty());
    }

    @Test
    void registerRejectsBlankNameBadEmailAndShortPassword() {
        List<String> messages = messages(new RegisterRequest(" ", "no-es-correo", "123"));
        assertTrue(messages.contains("El nombre es obligatorio"));
        assertTrue(messages.contains("Ingresa un correo valido"));
        assertTrue(messages.contains("La contrasena debe tener al menos 8 caracteres"));
    }

    @Test
    void loginDoesNotEnforcePasswordLengthButRequiresBoth() {
        assertTrue(messages(new LoginRequest("a@b.co", "x")).isEmpty());
        assertEquals(2, messages(new LoginRequest("", null)).size());
    }

    @Test
    void taskAndSubtaskRequireTitle() {
        assertEquals(List.of("El titulo de la tarea es obligatorio"),
                messages(new CreateTaskRequest(" ", null, null, null)));
        assertEquals(List.of("El titulo de la subtarea es obligatorio"),
                messages(new CreateSubtaskRequest(null, null)));
    }

    @Test
    void habitAndCategoryRequireName() {
        assertEquals(List.of("El nombre del habito es obligatorio"),
                messages(new CreateHabitRequest("", null, null, null, null)));
        assertEquals(List.of("El nombre de la categoria es obligatorio"),
                messages(new CreateCategoryRequest("", null)));
    }
}
