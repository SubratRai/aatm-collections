package com.codelife.aatmCollections.service;

import com.codelife.aatmCollections.config.JwtProperties;
import com.codelife.aatmCollections.domain.Role;
import com.codelife.aatmCollections.dto.AuthDtos;
import com.codelife.aatmCollections.entity.RefreshToken;
import com.codelife.aatmCollections.entity.UserAccount;
import com.codelife.aatmCollections.repository.RefreshTokenRepository;
import com.codelife.aatmCollections.repository.UserAccountRepository;
import com.codelife.aatmCollections.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuthenticationManager authenticationManager;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        UserAccount user = UserAccount.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(Role.CUSTOMER)
                .build();
        users.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
        );
        UserAccount user = users.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        return issueTokens(user);
    }

    @Transactional
    public AuthDtos.AuthResponse refresh(String refreshToken) {
        RefreshToken stored = refreshTokens.findByTokenAndRevokedFalse(refreshToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }
        stored.setRevoked(true);
        return issueTokens(stored.getUser());
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserResponse me(String email) {
        UserAccount user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserResponse(user);
    }

    private AuthDtos.AuthResponse issueTokens(UserAccount user) {
        String access = jwtService.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refresh = generateRefreshTokenValue();
        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .token(refresh)
                .expiresAt(Instant.now().plusSeconds(jwtProperties.getRefreshTokenDays() * 24 * 3600))
                .revoked(false)
                .build();
        refreshTokens.save(entity);

        AuthDtos.AuthResponse response = new AuthDtos.AuthResponse();
        response.setAccessToken(access);
        response.setRefreshToken(refresh);
        response.setUser(toUserResponse(user));
        return response;
    }

    private String generateRefreshTokenValue() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private AuthDtos.UserResponse toUserResponse(UserAccount user) {
        AuthDtos.UserResponse dto = new AuthDtos.UserResponse();
        dto.setId(user.getId().toString());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        return dto;
    }
}
