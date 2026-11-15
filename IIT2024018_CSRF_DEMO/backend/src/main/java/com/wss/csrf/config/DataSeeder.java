package com.wss.csrf.config;

import com.wss.csrf.model.AppUser;
import com.wss.csrf.model.AuditEntry;
import com.wss.csrf.model.Message;
import com.wss.csrf.repository.AuditRepository;
import com.wss.csrf.repository.MessageRepository;
import com.wss.csrf.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(UserRepository users, MessageRepository messages,
                           AuditRepository audit, PasswordEncoder encoder) {
        return args -> {
            if (users.count() == 0) {
                users.save(new AppUser("alice",   encoder.encode("admin123"), "ADMIN", "alice@devforge.io"));
                users.save(new AppUser("bob",     encoder.encode("user123"),  "USER",  "bob@devforge.io"));
                users.save(new AppUser("mallory", encoder.encode("hack123"),  "USER",  "mallory@devforge.io"));
            }
            if (messages.count() == 0) {
                messages.save(new Message("bob",
                        "Pushed the new OAuth flow to staging — reviews welcome before Friday's freeze."));
                messages.save(new Message("alice",
                        "Reminder: production deploy freeze starts Friday 5pm. Ping me for exceptions."));
                messages.save(new Message("mallory",
                        "Perk alert! Free JetBrains All-Products licences for the whole team — "
                        + "claim yours before EOD today: http://localhost:5500/team-perks.html"));
            }
            if (audit.count() == 0) {
                audit.save(new AuditEntry("system", "DevForge workspace initialised"));
            }
        };
    }
}
