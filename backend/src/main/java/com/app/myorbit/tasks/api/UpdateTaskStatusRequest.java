package com.app.myorbit.tasks.api;

public class UpdateTaskStatusRequest {
    private boolean done;

    public boolean isDone() {
        return done;
    }

    public void setDone(boolean done) {
        this.done = done;
    }
}
