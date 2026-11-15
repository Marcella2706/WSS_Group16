package com.wss.csrf.service;

import com.wss.csrf.model.AppUser;
import com.wss.csrf.repository.UserRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = repo.findById(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
        return User.withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole())
                .build();
    }

    public List<AppUser> getAllUsers() {
        return repo.findAll();
    }

    public AppUser getUser(String username) {
        return repo.findById(username).orElse(null);
    }

    public void updateRole(String username, String role) {
        repo.findById(username).ifPresent(user -> {
            user.setRole(role);
            repo.save(user);
        });
    }
}
