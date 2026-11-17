package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.SemesterService;
import com.app.myorbit.academic.application.SubjectService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/academic/overview")
public class AcademicOverviewController {
    private final SubjectService subjectService;
    private final SemesterService semesterService;

    public AcademicOverviewController(SubjectService subjectService, SemesterService semesterService) {
        this.subjectService = subjectService;
        this.semesterService = semesterService;
    }

    @GetMapping
    public AcademicOverviewResponse get(@CurrentUser User user) {
        var today = semesterService.today(user.getId());
        return new AcademicOverviewResponse(
                subjectService.listByUser(user.getId()).stream().map(SubjectResponse::from).toList(),
                semesterService.listByUser(user.getId()).stream().map(semester -> SemesterResponse.from(semester, today)).toList());
    }
}
