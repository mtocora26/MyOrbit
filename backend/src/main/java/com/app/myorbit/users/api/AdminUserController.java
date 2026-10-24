package com.app.myorbit.users.api;

import jakarta.validation.Valid;
import com.app.myorbit.users.application.UserAdminService;
import com.app.myorbit.users.domain.User;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {
    private final UserAdminService userAdminService;

    public AdminUserController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @GetMapping
    public List<AdminUserResponse> list(@CurrentUser User actor) {
        return userAdminService.list(actor);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserResponse create(@CurrentUser User actor, @Valid @RequestBody CreateUserRequest request) {
        return userAdminService.create(actor, request);
    }

    @PatchMapping("/{id}")
    public AdminUserResponse update(@CurrentUser User actor, @PathVariable String id, @Valid @RequestBody UpdateUserRequest request) {
        return userAdminService.update(actor, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser User actor, @PathVariable String id) {
        userAdminService.delete(actor, id);
    }
}
