package com.stocksim.backend.controllers;

import com.stocksim.backend.model.Trade;
import com.stocksim.backend.model.User;
import com.stocksim.backend.repositories.TradeRepository;
import com.stocksim.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/trades")
@CrossOrigin(origins = "http://localhost:5173") // allow React frontend
public class TradeController {

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private UserRepository userRepository;

    // --- BUY STOCK ---
    @PostMapping("/buy")
    public ResponseEntity<?> buyStock(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String symbol = request.get("symbol").toString();
            int quantity = Integer.parseInt(request.get("quantity").toString());
            double price = Double.parseDouble(request.get("price").toString());

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            double totalCost = price * quantity;
            if (user.getBalance() < totalCost) {
                return ResponseEntity.badRequest().body("Insufficient balance");
            }

            // Create trade
            Trade trade = new Trade();
            trade.setUser(user);
            trade.setStockSymbol(symbol);
            trade.setQuantity(quantity);
            trade.setPrice(price);
            trade.setTradeType("BUY");
            tradeRepository.save(trade);

            // Deduct balance
            user.setBalance(user.getBalance() - totalCost);
            userRepository.save(user);

            return ResponseEntity.ok("Stock bought successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // --- SELL STOCK ---
    @PostMapping("/sell")
    public ResponseEntity<?> sellStock(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String symbol = request.get("symbol").toString();
            int quantity = Integer.parseInt(request.get("quantity").toString());
            double price = Double.parseDouble(request.get("price").toString());

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            // Check current holdings
            Integer netQuantity = tradeRepository.getNetQuantity(userId, symbol);
            if (netQuantity == null) netQuantity = 0;
            if (netQuantity < quantity) {
                return ResponseEntity.badRequest().body("Insufficient shares to sell");
            }

            // Create trade
            Trade trade = new Trade();
            trade.setUser(user);
            trade.setStockSymbol(symbol);
            trade.setQuantity(quantity);
            trade.setPrice(price);
            trade.setTradeType("SELL");
            tradeRepository.save(trade);

            // Add balance
            user.setBalance(user.getBalance() + price * quantity);
            userRepository.save(user);

            return ResponseEntity.ok("Stock sold successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    // --- GET ALL TRADES FOR A USER ---
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserTrades(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return ResponseEntity.badRequest().body("User not found");

            return ResponseEntity.ok(tradeRepository.findByUser(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
