package com.app.myorbit.academic.api;

import com.app.myorbit.academic.application.ClassAgendaService;
import com.app.myorbit.academic.application.ClassAgendaService.ClassNow;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/academic/classes")
public class ClassAgendaController {
    private final ClassAgendaService classService;

    public ClassAgendaController(ClassAgendaService classService) {
        this.classService = classService;
    }

    /** Clases entre {@code from} y {@code to} (ambas incluidas, máximo 62 días de rango). */
    @GetMapping
    public List<ClassOccurrenceResponse> list(@CurrentUser User user,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return classService.between(user.getId(), from, to).stream().map(ClassOccurrenceResponse::from).toList();
    }

    /** La clase en curso y la siguiente, según la hora local del usuario. */
    @GetMapping("/now")
    public ClassNowResponse now(@CurrentUser User user) {
        ClassNow now = classService.now(user.getId());
        return new ClassNowResponse(now.current() == null ? null : ClassOccurrenceResponse.from(now.current()),
                now.next() == null ? null : ClassOccurrenceResponse.from(now.next()));
    }

    /** {@code current}: en la que está ahora (null si no está en clase). {@code next}: la siguiente que empieza (null si no hay). */
    public record ClassNowResponse(ClassOccurrenceResponse current, ClassOccurrenceResponse next) {
    }
}
