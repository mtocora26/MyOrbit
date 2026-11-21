package com.app.myorbit.tasks.api;

import java.time.Instant;

public class UpdateTaskStatusRequest {
    private boolean done;
    /** Momento en que el usuario hizo el cambio (si fue sin conexión); null = ahora. Ver {@link UpdateTaskRequest}. */
    private Instant clientTime;

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }

    public Instant getClientTime() {
        return clientTime;
    }

    public void setClientTime(Instant clientTime) {
        this.clientTime = clientTime;
    }
}
