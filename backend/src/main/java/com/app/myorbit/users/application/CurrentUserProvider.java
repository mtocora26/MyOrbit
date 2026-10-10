package com.app.myorbit.users.application;

import com.app.myorbit.users.domain.User;

public interface CurrentUserProvider {
    User requireUser(String authorization);
}
