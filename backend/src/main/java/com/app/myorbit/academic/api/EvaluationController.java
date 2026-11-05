package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.EvaluationService;
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
@RequestMapping("/api/subjects/{subjectId}/evaluations")
public class EvaluationController {
    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @GetMapping
    public List<EvaluationResponse> list(@PathVariable String subjectId, @CurrentUser User user) {
        return evaluationService.list(user.getId(), subjectId).stream().map(EvaluationResponse::from).toList();
    }

    @GetMapping("/{id}")
    public EvaluationResponse get(@PathVariable String subjectId, @PathVariable String id, @CurrentUser User user) {
        return EvaluationResponse.from(evaluationService.getOwned(user.getId(), subjectId, id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluationResponse create(@PathVariable String subjectId, @Valid @RequestBody EvaluationRequest request, @CurrentUser User user) {
        return EvaluationResponse.from(evaluationService.create(user.getId(), subjectId, request));
    }

    @PutMapping("/{id}")
    public EvaluationResponse update(@PathVariable String subjectId, @PathVariable String id, @Valid @RequestBody EvaluationRequest request, @CurrentUser User user) {
        return EvaluationResponse.from(evaluationService.update(user.getId(), subjectId, id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String subjectId, @PathVariable String id, @CurrentUser User user) {
        evaluationService.delete(user.getId(), subjectId, id);
    }
}
