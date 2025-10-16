package com.stocksim.backend.service;

import com.stocksim.backend.model.Trade;
import com.stocksim.backend.model.User;
import com.stocksim.backend.repositories.TradeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class PortfolioService {

    private static final String FASTAPI_BASE = "https://yfinance-api-iseh.onrender.com";
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    private TradeRepository tradeRepository;

    public Map<String, Object> getUserPortfolio(User user) {
        List<Trade> trades = tradeRepository.findByUser(user);

        Map<String, Double> totalInvested = new HashMap<>();
        Map<String, Integer> totalQty = new HashMap<>();
        Map<String, Double> currentValue = new HashMap<>();

        // --- Aggregate trades per stock ---
        for (Trade trade : trades) {
            String symbol = trade.getStockSymbol();
            int qty = trade.getTradeType().equalsIgnoreCase("BUY") ? trade.getQuantity() : -trade.getQuantity();

            totalQty.put(symbol, totalQty.getOrDefault(symbol, 0) + qty);
            totalInvested.put(symbol, totalInvested.getOrDefault(symbol, 0.0) + trade.getPrice() * qty);
        }

        double totalGainLoss = 0.0;
        double totalCurrentValue = 0.0;

        // --- Fetch live current prices from FastAPI ---
        for (String symbol : totalQty.keySet()) {
            int qty = totalQty.get(symbol);
            if (qty <= 0) continue;

            try {
                String url = FASTAPI_BASE + "/ticker/" + symbol + ".NS/info";
                Map<String, Object> data = restTemplate.getForObject(url, Map.class);

                if (data == null || !data.containsKey("currentPrice")) continue;

                double currentPrice = ((Number) data.get("currentPrice")).doubleValue();
                double invested = totalInvested.get(symbol);
                double value = qty * currentPrice;

                currentValue.put(symbol, value);
                totalCurrentValue += value;

                // gain/loss = (current value - invested)
                totalGainLoss += (value - invested);

            } catch (Exception e) {
                System.err.println("Error fetching price for " + symbol + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalValue", totalCurrentValue);
        result.put("gainLoss", totalGainLoss);
        result.put("holdings", currentValue);

        return result;
    }
}
