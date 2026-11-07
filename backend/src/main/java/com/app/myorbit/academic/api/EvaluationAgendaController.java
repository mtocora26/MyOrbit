package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.EvaluationAgendaService;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/academic/evaluations")
public class EvaluationAgendaController {
    private final EvaluationAgendaService agendaService;

    public EvaluationAgendaController(EvaluationAgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping
    public List<AgendaEvaluationResponse> list(@CurrentUser User user,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueFrom,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueTo) {
        return agendaService.listWithDue(user.getId(), dueFrom, dueTo).stream().map(AgendaEvaluationResponse::from).toList();
    }
}
