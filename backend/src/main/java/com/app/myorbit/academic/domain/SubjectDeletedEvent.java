package com.app.myorbit.academic.domain;

/** Se publica al eliminar una materia para que otros módulos (tareas) limpien sus referencias. */
public record SubjectDeletedEvent(String userId, String subjectId) {
}
