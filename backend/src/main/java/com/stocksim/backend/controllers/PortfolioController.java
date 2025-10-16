package com.stocksim.backend.controllers;

import com.stocksim.backend.model.User;
import com.stocksim.backend.service.PortfolioService;
import com.stocksim.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "http://localhost:5173")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private UserRepository userRepository;

    // Get full portfolio summary for a user
    @GetMapping("/{userId}")
    public ResponseEntity<?> getPortfolio(@PathVariable Long userId) {
        // Find the user by ID
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }

        // Pass the user object to service
        Map<String, Object> portfolio = portfolioService.getUserPortfolio(user);
        return ResponseEntity.ok(portfolio);
    }
}
