package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SemesterService;
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
@RequestMapping("/api/semesters")
public class SemesterController {
    private final SemesterService semesterService;

    public SemesterController(SemesterService semesterService) {
        this.semesterService = semesterService;
    }

    @GetMapping
    public List<SemesterResponse> list(@CurrentUser User user) {
        var today = semesterService.today(user.getId());
        return semesterService.listByUser(user.getId()).stream().map(semester -> SemesterResponse.from(semester, today)).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SemesterResponse create(@Valid @RequestBody SemesterRequest request, @CurrentUser User user) {
        return SemesterResponse.from(semesterService.create(user.getId(), request), semesterService.today(user.getId()));
    }

    @PutMapping("/{id}")
    public SemesterResponse update(@PathVariable String id, @Valid @RequestBody SemesterRequest request, @CurrentUser User user) {
        return SemesterResponse.from(semesterService.update(user.getId(), id, request), semesterService.today(user.getId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @CurrentUser User user) {
        semesterService.delete(user.getId(), id);
    }
}
