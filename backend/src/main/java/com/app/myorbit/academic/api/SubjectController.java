package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {
    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public List<SubjectResponse> list(@CurrentUser User user) {
        return subjectService.listByUser(user.getId()).stream().map(SubjectResponse::from).toList();
    }

    @GetMapping("/{id}")
    public SubjectResponse get(@PathVariable String id, @CurrentUser User user) {
        return SubjectResponse.from(subjectService.getOwned(user.getId(), id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SubjectResponse create(@Valid @RequestBody SubjectRequest request, @CurrentUser User user) {
        return SubjectResponse.from(subjectService.create(user.getId(), request));
    }

    @PutMapping("/{id}")
    public SubjectResponse update(@PathVariable String id, @Valid @RequestBody SubjectRequest request, @CurrentUser User user) {
        return SubjectResponse.from(subjectService.update(user.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        subjectService.delete(user.getId(), id);
    }
}
