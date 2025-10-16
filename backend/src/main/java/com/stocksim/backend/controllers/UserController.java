package com.stocksim.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.stocksim.backend.model.User;       // <-- your User entity
import com.stocksim.backend.repositories.UserRepository; // <-- your repo

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") // allow React frontend
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        // check if email exists
        System.out.println("Registering user with email: " + user.getEmail());
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Email already registered");
        }

        user.setBalance(10000.0); 
        User savedUser = userRepository.save(user); // save and get persisted user
        return ResponseEntity.ok(savedUser.getId()); // return the ID
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail());
        if (user == null || !user.getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
        return ResponseEntity.ok(user.getId());
    }
    @GetMapping("/user/{userId}/balance")
    public ResponseEntity<?> getUserBalance(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        return ResponseEntity.ok(Map.of("balance", user.getBalance()));
    }

}
