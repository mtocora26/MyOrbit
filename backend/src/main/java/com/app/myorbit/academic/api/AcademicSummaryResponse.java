package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.AcademicSummary;
import com.app.myorbit.academic.application.AcademicSummary.SubjectStanding;

import java.util.List;

public record AcademicSummaryResponse(Double weightedAverage, int totalCredits, int gradedCredits, double targetGrade,
                                      List<SubjectStandingResponse> subjects, List<SubjectStandingResponse> atRisk) {
    public record SubjectStandingResponse(String subjectId, String name, int credits, String semester,
                                          GradeSummaryResponse grades, boolean atRisk) {
        static SubjectStandingResponse from(SubjectStanding standing) {
            return new SubjectStandingResponse(standing.subjectId(), standing.name(), standing.credits(), standing.semester(),
                    GradeSummaryResponse.from(standing.grades()), standing.atRisk());
        }
    }

    public static AcademicSummaryResponse from(AcademicSummary summary) {
        return new AcademicSummaryResponse(summary.weightedAverage(), summary.totalCredits(), summary.gradedCredits(),
                summary.targetGrade(), summary.subjects().stream().map(SubjectStandingResponse::from).toList(),
                summary.atRisk().stream().map(SubjectStandingResponse::from).toList());
    }
}
