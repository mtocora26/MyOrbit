package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.AcademicSummaryService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/academic/summary")
public class AcademicSummaryController {
    private final AcademicSummaryService summaryService;

    public AcademicSummaryController(AcademicSummaryService summaryService) {
        this.summaryService = summaryService;
    }

    @GetMapping
    public AcademicSummaryResponse get(@RequestParam(required = false) String semester,
                                       @RequestParam(required = false) Double target, @CurrentUser User user) {
        return AcademicSummaryResponse.from(summaryService.summarize(user.getId(), semester, target));
    }
}
