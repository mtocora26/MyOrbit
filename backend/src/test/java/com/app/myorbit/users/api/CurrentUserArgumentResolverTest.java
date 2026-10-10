package com.app.myorbit.users.api;

import com.app.myorbit.shared.error.UnauthorizedException;
import com.app.myorbit.users.application.CurrentUserProvider;
import com.app.myorbit.users.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CurrentUserArgumentResolverTest {
    private final CurrentUserProvider provider = mock(CurrentUserProvider.class);
    private final CurrentUserArgumentResolver resolver = new CurrentUserArgumentResolver(provider);

    @Test
    void resolvesUserFromAuthorizationHeader() {
        User user = new User();
        when(provider.requireUser("Bearer abc")).thenReturn(user);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer abc");

        assertSame(user, resolver.resolveArgument(null, null, new ServletWebRequest(request), null));
    }

    @Test
    void propagatesUnauthorizedWhenHeaderIsMissing() {
        when(provider.requireUser(null)).thenThrow(new UnauthorizedException("Debes iniciar sesion"));

        assertThrows(UnauthorizedException.class,
                () -> resolver.resolveArgument(null, null, new ServletWebRequest(new MockHttpServletRequest()), null));
    }
}
