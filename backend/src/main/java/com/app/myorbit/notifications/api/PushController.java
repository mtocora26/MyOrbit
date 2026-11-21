package com.app.myorbit.notifications.api;

import com.app.myorbit.notifications.application.PushService;
import com.app.myorbit.notifications.domain.PushChannel;
import com.app.myorbit.users.api.CurrentUser;
import com.app.myorbit.users.domain.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/push")
public class PushController {
    private final PushService service;

    public PushController(PushService service) {
        this.service = service;
    }

    @GetMapping("/config")
    public PushConfigResponse config(@CurrentUser User user) {
        return new PushConfigResponse(service.webPublicKey(), service.isAvailable(PushChannel.WEB), service.isAvailable(PushChannel.FCM));
    }

    /** Los dispositivos de la cuenta. */
    @GetMapping("/subscriptions")
    public List<PushSubscriptionResponse> list(@CurrentUser User user) {
        return service.listByUser(user.getId()).stream().map(PushSubscriptionResponse::from).toList();
    }

    /** Registra (o actualiza) un dispositivo. Si ya era de otra cuenta, pasa a esta. */
    @PostMapping("/subscriptions")
    @ResponseStatus(HttpStatus.CREATED)
    public PushSubscriptionResponse register(@Valid @RequestBody PushSubscriptionRequest request, @CurrentUser User user) {
        return PushSubscriptionResponse.from(service.register(user.getId(), request.channel(), request.address(), request.p256dh(), request.auth()));
    }

    /** Quita un dispositivo de la cuenta; si no existe, no falla. */
    @DeleteMapping("/subscriptions")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@RequestParam String address, @CurrentUser User user) {
        service.unregister(user.getId(), address);
    }
}
