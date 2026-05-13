package org.peluqueriaFAR.peluqueriaFAR.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MailConfigValidator implements ApplicationRunner {

    private final Environment environment;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:0}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    public MailConfigValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length == 0) {
            profiles = environment.getDefaultProfiles();
        }

        // Never log the password; just enough to confirm which config is loaded.
        log.info("Mail config loaded: profiles={}, host={}, port={}, username={}",
                String.join(",", profiles),
                mailHost,
                mailPort,
                (mailUsername == null || mailUsername.isBlank()) ? "<empty>" : mailUsername);

        if (mailPassword != null && !mailPassword.isBlank() && mailPassword.matches(".*\\s+.*")) {
            log.warn("spring.mail.password contiene espacios. En Gmail App Password debe ir sin espacios (16 caracteres).");
        }

        if (mailHost != null && mailHost.contains("gmail") && (mailUsername == null || mailUsername.isBlank())) {
            log.warn("SMTP Gmail configurado pero spring.mail.username esta vacio.");
        }
    }
}
