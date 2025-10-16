package com.stocksim.backend.controllers;

import com.stocksim.backend.model.User;
import com.stocksim.backend.model.Trade;
import com.stocksim.backend.repositories.TradeRepository;
import com.stocksim.backend.repositories.UserRepository;
import com.stocksim.backend.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class LeaderboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private StockService stockService;

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard() {
        try {
            System.out.println("INSIDE LEADERBOARD");
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> leaderboard = new ArrayList<>();

            for (User user : users) {
                System.out.println("FETCHING FOR USER ID:"+user.getId());
                double totalValue = user.getBalance(); // start with cash
                System.out.println("USER:"+user);
                // Fetch all trades of this user
                List<Trade> trades = tradeRepository.findByUser(user);
                System.out.println("TRADES:"+trades);
                // Map to store net holdings per stock
                Map<String, Integer> holdings = new HashMap<>();
                for (Trade trade : trades) {
                    holdings.put(
                        trade.getStockSymbol(),
                        holdings.getOrDefault(trade.getStockSymbol(), 0) +
                                (trade.getTradeType().equals("BUY") ? trade.getQuantity() : -trade.getQuantity())
                    );
                }
                System.out.println("LEVEL 1 passed");
                // Add current value of stocks
                for (Map.Entry<String, Integer> entry : holdings.entrySet()) {
                    String symbol = entry.getKey();
                    int quantity = entry.getValue();
                    if (quantity <= 0) continue;

                    Map<String, Object> stockData = stockService.getStock(symbol);
                    if (stockData != null && stockData.containsKey("price")) {
                        double currentPrice = ((Number) stockData.get("price")).doubleValue();
                        totalValue += currentPrice * quantity;
                    }
                }
                System.out.println("LEVEL 2 passed");
                // Build leaderboard entry
                Map<String, Object> userEntry = new HashMap<>();
                userEntry.put("id", user.getId());
                userEntry.put("username", user.getUsername());
                userEntry.put("totalValue", totalValue);
                leaderboard.add(userEntry);
            }

            // Sort descending by totalValue
            leaderboard.sort((a, b) -> Double.compare(
                    ((Number) b.get("totalValue")).doubleValue(),
                    ((Number) a.get("totalValue")).doubleValue()
            ));
            System.out.println("USERS:"+leaderboard);
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching leaderboard: " + e.getMessage());
        }
    }
}
