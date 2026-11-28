package com.app.myorbit.users.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.users.domain.User;
import com.app.myorbit.users.domain.UserDeletedEvent;
import com.app.myorbit.users.infrastructure.UserRepository;
import com.app.myorbit.users.infrastructure.UserSessionRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** Eliminación definitiva de una cuenta, la pida su dueño o un administrador. */
@Service
public class AccountDeletionService {
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher events;

    public AccountDeletionService(UserRepository userRepository, UserSessionRepository sessionRepository,
                                  PasswordEncoder passwordEncoder, ApplicationEventPublisher events) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.events = events;
    }

    /**
     * El usuario elimina su propia cuenta confirmando la contraseña. Una contraseña equivocada es un {@code 400} y no
     * un {@code 401}: la sesión sigue siendo válida.
     */
    public void deleteOwn(User user, String password) {
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessRuleException("La contraseña es incorrecta");
        }
        if (isLastActiveAdmin(user)) {
            throw new BusinessRuleException("Eres el único administrador: nombra a otro antes de eliminar tu cuenta");
        }
        erase(user.getId());
    }

    /**
     * Elimina la cuenta y todos sus datos. Primero cierra sus sesiones y avisa a los demás módulos; la cuenta se borra
     * al final, así que si algo falla sigue existiendo y la operación se puede repetir.
     */
    void erase(String userId) {
        sessionRepository.deleteByUserId(userId);
        events.publishEvent(new UserDeletedEvent(userId));
        userRepository.deleteById(userId);
    }

    boolean isLastActiveAdmin(User user) {
        return user.isAdmin() && user.isActive()
                && userRepository.findAll().stream().filter(other -> other.isAdmin() && other.isActive()).count() <= 1;
    }
}
