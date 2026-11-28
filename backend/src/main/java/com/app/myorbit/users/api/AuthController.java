package com.app.myorbit.users.api;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import com.app.myorbit.users.application.AccountDeletionService;
import com.app.myorbit.users.application.AuthService;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AccountDeletionService accountDeletion;

    public AuthController(AuthService authService, AccountDeletionService accountDeletion) {
        this.authService = authService;
        this.accountDeletion = accountDeletion;
    }

    @SecurityRequirements
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @SecurityRequirements
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthResponse me(@CurrentUser User user) {
        return AuthResponse.of(null, user);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAccount(@CurrentUser User user, @Valid @RequestBody DeleteAccountRequest request) {
        accountDeletion.deleteOwn(user, request.password());
    }

    @PutMapping("/me/name")
    public AuthResponse updateName(@CurrentUser User user, @Valid @RequestBody UpdateNameRequest request) {
        com.app.myorbit.users.domain.User updated = authService.updateName(user.getId(), request.name());
        return AuthResponse.of(null, updated);
    }

    @PutMapping("/me/timezone")
    public AuthResponse updateTimeZone(@CurrentUser User user, @Valid @RequestBody UpdateTimeZoneRequest request) {
        com.app.myorbit.users.domain.User updated = authService.updateTimeZone(user.getId(), request.timeZone());
        return AuthResponse.of(null, updated);
    }

    @PostMapping("/me/terms")
    public AuthResponse acceptTerms(@CurrentUser User user, @Valid @RequestBody AcceptTermsRequest request) {
        return AuthResponse.of(null, authService.acceptTerms(user.getId(), request.acceptedTermsVersion(), request.ageDeclaration()));
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUser User user, @RequestHeader("Authorization") String authorization,
                               @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user.getId(), authorization, request.currentPassword(), request.newPassword());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String authorization) {
        authService.logout(authorization);
    }
}
