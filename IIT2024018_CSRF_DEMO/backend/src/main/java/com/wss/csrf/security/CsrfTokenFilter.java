package com.wss.csrf.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.codec.Utf8;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Set;

public class CsrfTokenFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-CSRF-TOKEN";
    public static final String SESSION_ATTR = "CSRF_TOKEN";

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    private static final Set<String> EXEMPT_PATHS = Set.of("/api/login", "/api/logout", "/api/csrf");

    public static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        if (requiresCheck(req)) {
            HttpSession session = req.getSession(false);
            String expected = session == null ? null : (String) session.getAttribute(SESSION_ATTR);
            String actual = req.getHeader(HEADER);

            if (expected == null || actual == null || !constantTimeEquals(expected, actual)) {
                res.sendError(HttpServletResponse.SC_FORBIDDEN, "CSRF token missing or invalid");
                return;
            }
        }
        chain.doFilter(req, res);
    }

    private boolean requiresCheck(HttpServletRequest req) {
        if (SAFE_METHODS.contains(req.getMethod())) return false;
        String path = req.getRequestURI();
        return !EXEMPT_PATHS.contains(path);
    }

    private boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(Utf8.encode(a), Utf8.encode(b));
    }
}
