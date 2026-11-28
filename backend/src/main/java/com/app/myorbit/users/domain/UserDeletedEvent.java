package com.app.myorbit.users.domain;

/**
 * Una cuenta se está eliminando: cada módulo borra los datos que guarda de ese usuario. Los observadores son
 * síncronos y no capturan errores, para que el borrado se detenga y se pueda repetir si alguno falla.
 */
public record UserDeletedEvent(String userId) {
}
