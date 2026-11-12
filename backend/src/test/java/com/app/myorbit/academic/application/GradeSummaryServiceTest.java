package com.app.myorbit.academic.application;

import com.app.myorbit.shared.error.BusinessRuleException;
import com.app.myorbit.users.application.UserProfileService;
import com.app.myorbit.users.domain.UserProfile;
import com.app.myorbit.academic.domain.Subject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GradeSummaryServiceTest {
    private final EvaluationService evaluations = mock(EvaluationService.class);
    private final SubjectService subjects = mock(SubjectService.class);
    private final UserProfileService profiles = mock(UserProfileService.class);
    private final GradeSummaryService service = new GradeSummaryService(evaluations, subjects, profiles, new WeightedGradeStrategy());

    @BeforeEach
    void subjectWithoutOwnGoals() {
        when(subjects.getOwned("u1", "s1")).thenReturn(subject(null, null));
    }

    private Subject subject(Double target, Double passing) {
        Subject subject = new Subject();
        subject.setId("s1");
        subject.setUserId("u1");
        subject.update("Redes", 3, "2026-1", "#2E90FA", target, passing);
        return subject;
    }

    private void profileTarget(String target) {
        UserProfile profile = new UserProfile();
        profile.setGradeTarget(target);
        when(profiles.find("u1")).thenReturn(Optional.of(profile));
    }

    @Test
    void usesTheProfileTargetAcceptingCommas() {
        when(evaluations.list("u1", "s1")).thenReturn(List.of());
        profileTarget("4,2");

        assertEquals(4.2, service.summarize("u1", "s1", null).targetGrade());
    }

    @Test
    void fallsBackToTheDefaultWhenTheProfileTargetIsMissingOrInvalid() {
        when(evaluations.list("u1", "s1")).thenReturn(List.of());
        profileTarget("alta");
        assertEquals(GradeSummaryService.DEFAULT_TARGET, service.summarize("u1", "s1", null).targetGrade());

        when(profiles.find("u1")).thenReturn(Optional.empty());
        assertEquals(GradeSummaryService.DEFAULT_TARGET, service.summarize("u1", "s1", null).targetGrade());
    }

    @Test
    void theTargetParameterOverridesTheProfile() {
        when(evaluations.list("u1", "s1")).thenReturn(List.of());
        profileTarget("4.0");

        assertEquals(3.8, service.summarize("u1", "s1", 3.8).targetGrade());
        assertThrows(BusinessRuleException.class, () -> service.summarize("u1", "s1", 5.5));
    }

    @Test
    void theSubjectTargetBeatsTheProfileButNotTheParameter() {
        when(evaluations.list("u1", "s1")).thenReturn(List.of());
        profileTarget("4.0");
        when(subjects.getOwned("u1", "s1")).thenReturn(subject(4.5, null));

        assertEquals(4.5, service.summarize("u1", "s1", null).targetGrade());
        assertEquals(3.8, service.summarize("u1", "s1", 3.8).targetGrade());
    }

    @Test
    void passingGradeDefaultsToThreeAndComesFromTheSubjectWhenSet() {
        when(evaluations.list("u1", "s1")).thenReturn(List.of());
        profileTarget("4.0");

        assertEquals(Subject.DEFAULT_PASSING_GRADE, service.summarize("u1", "s1", null).passingGrade());
        when(subjects.getOwned("u1", "s1")).thenReturn(subject(null, 3.5));
        assertEquals(3.5, service.summarize("u1", "s1", null).passingGrade());
        assertEquals(4.0, service.summarize("u1", "s1", null).targetGrade());
    }
}
