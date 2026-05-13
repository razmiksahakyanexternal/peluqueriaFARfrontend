package org.peluqueriaFAR.peluqueriaFAR.service;

import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.UserResponse;
import org.peluqueriaFAR.peluqueriaFAR.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> new UserResponse(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getEmail()
            ))
            .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        return userRepository.searchBySurname(query).stream()
            .map(user -> new UserResponse(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getEmail()
            ))
            .collect(Collectors.toList());
    }
}

