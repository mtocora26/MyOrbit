package com.app.myorbit.categories.domain;

/** Se publica al eliminar una categoría para que otros módulos limpien sus referencias. */
public record CategoryDeletedEvent(String userId, String categoryId) {
}
