package com.app.myorbit.shared.error;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.core.MethodParameter;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    @Test
    void notFoundMapsTo404() {
        ProblemDetail problem = handler.notFound(new NotFoundException("No existe"));
        assertEquals(404, problem.getStatus());
        assertEquals("No existe", problem.getDetail());
    }

    @Test
    void businessRuleMapsTo400() {
        ProblemDetail problem = handler.badRequest(new BusinessRuleException("Regla"));
        assertEquals(400, problem.getStatus());
        assertEquals("Regla", problem.getDetail());
    }

    @Test
    void unauthorizedMapsTo401() {
        ProblemDetail problem = handler.unauthorized(new UnauthorizedException("Sesion no valida"));
        assertEquals(401, problem.getStatus());
    }

    @Test
    void forbiddenMapsTo403() {
        ProblemDetail problem = handler.forbidden(new ForbiddenException("Sin permisos"));
        assertEquals(403, problem.getStatus());
    }

    @Test
    void missingAuthorizationHeaderMapsTo401() throws Exception {
        MethodParameter parameter = new MethodParameter(Object.class.getMethod("toString"), -1);
        ProblemDetail problem = handler.missingHeader(new MissingRequestHeaderException("Authorization", parameter));
        assertEquals(401, problem.getStatus());
    }

    @Test
    void illegalArgumentMapsTo400() {
        ProblemDetail problem = handler.illegalArgument(new IllegalArgumentException("Prioridad no valida: x"));
        assertEquals(400, problem.getStatus());
        assertEquals("Prioridad no valida: x", problem.getDetail());
    }

    @Test
    void unreadableBodyMapsTo400() {
        ProblemDetail problem = handler.unreadableBody(
                new HttpMessageNotReadableException("JSON malformado", (HttpInputMessage) null));
        assertEquals(400, problem.getStatus());
    }

    @Test
    void invalidBodyMapsTo400WithFirstFieldMessage() throws Exception {
        MethodParameter parameter = new MethodParameter(Object.class.getMethod("toString"), -1);
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "request");
        result.addError(new FieldError("request", "title", "El titulo es obligatorio"));

        ProblemDetail problem = handler.invalidBody(new MethodArgumentNotValidException(parameter, result));

        assertEquals(400, problem.getStatus());
        assertEquals("El titulo es obligatorio", problem.getDetail());
    }
}
