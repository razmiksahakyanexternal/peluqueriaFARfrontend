package org.peluqueriaFAR.peluqueriaFAR.controller;

import lombok.RequiredArgsConstructor;
import org.peluqueriaFAR.peluqueriaFAR.dto.UserResponse;
import org.peluqueriaFAR.peluqueriaFAR.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }


    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam("q") String query) {
        return ResponseEntity.ok(userService.searchUsers(query));
    }
}

