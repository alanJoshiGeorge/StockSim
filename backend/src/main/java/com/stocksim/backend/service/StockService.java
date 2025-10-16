package com.stocksim.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StockService {

    private static final String FASTAPI_BASE = "https://yfinance-api-iseh.onrender.com";
    private final RestTemplate restTemplate = new RestTemplate();

    // Initial popular stocks for display
    private static final List<String> SYMBOLS = Arrays.asList(
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS",
        "ICICIBANK.NS", "SBIN.NS", "HINDUNILVR.NS", "BAJFINANCE.NS"
    );

    // Fetch basic info for initial popular stocks
    public List<Map<String, Object>> getAllStocks() {
        List<Map<String, Object>> stocks = new ArrayList<>();

        for (String symbol : SYMBOLS) {
            try {
                String url = FASTAPI_BASE + "/ticker/" + symbol + "/info";
                Map<String, Object> data = restTemplate.getForObject(url, Map.class);
                System.out.println(data+"Data");
                if (data != null && data.containsKey("currentPrice")) {
                    Map<String, Object> stock = new LinkedHashMap<>();
                    stock.put("symbol", symbol.replace(".NS", ""));
                    stock.put("name", data.getOrDefault("longName", symbol));
                    stock.put("sector", data.getOrDefault("sector", "N/A"));
                    stock.put("price", ((Number) data.get("currentPrice")).doubleValue());
                    stock.put("change", ((Number) data.getOrDefault("regularMarketChange", 0)).doubleValue());
                    stock.put("volume", ((Number) data.getOrDefault("volume", 0)).longValue());
                    stock.put("marketCap", ((Number) data.getOrDefault("marketCap", 0)).longValue());
                    stocks.add(stock);
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch " + symbol + ": " + e.getMessage());
            }
        }
        return stocks;
    }

    // Fetch info for a single stock by symbol
    public Map<String, Object> getStock(String symbol) {
        try {
            String url = FASTAPI_BASE + "/ticker/" + symbol + ".NS/info";
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            if (data == null || !data.containsKey("currentPrice")) return Collections.emptyMap();

            Map<String, Object> stock = new LinkedHashMap<>();
            stock.put("symbol", symbol);
            stock.put("name", data.getOrDefault("longName", symbol));
            stock.put("sector", data.getOrDefault("sector", "N/A"));
            stock.put("price", ((Number) data.get("currentPrice")).doubleValue());
            stock.put("change", ((Number) data.getOrDefault("regularMarketChange", 0)).doubleValue());
            stock.put("volume", ((Number) data.getOrDefault("volume", 0)).longValue());
            stock.put("marketCap", ((Number) data.getOrDefault("marketCap", 0)).longValue());
            return stock;
        } catch (Exception e) {
            System.err.println("Failed to fetch stock " + symbol + ": " + e.getMessage());
            return Collections.emptyMap();
        }
    }

    // Dynamic search for any stock symbol
    public Map<String, Object> searchStock(String query) {
        try {
            System.out.println("Searching for: " + query);
            String symbol = query.toUpperCase();
            if (!symbol.endsWith(".NS")) symbol += ".NS";
            String url = FASTAPI_BASE + "/ticker/" + symbol + "/info";
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            System.out.println(data+"Data");
            if (data == null || !data.containsKey("currentPrice")) return Collections.emptyMap();

            Map<String, Object> stock = new LinkedHashMap<>();
            stock.put("symbol", symbol.replace(".NS", ""));
            stock.put("name", data.getOrDefault("longName", symbol));
            stock.put("sector", data.getOrDefault("sector", "N/A"));
            stock.put("price", ((Number) data.get("currentPrice")).doubleValue());
            stock.put("change", ((Number) data.getOrDefault("regularMarketChange", 0)).doubleValue());
            stock.put("volume", ((Number) data.getOrDefault("volume", 0)).longValue());
            stock.put("marketCap", ((Number) data.getOrDefault("marketCap", 0)).longValue());
            return stock;
        } catch (Exception e) {
            System.err.println("Failed to search stock " + query + ": " + e.getMessage());
            return Collections.emptyMap();
        }
    }
      
    public List<Map<String, Object>> getStockHistory(String symbol, String period, String interval) {
    try {
        // --- Determine interval if not provided ---
        if (interval == null || interval.isEmpty()) {
            switch (period) {
                case "1d":  interval = "1m"; break;
                case "7d":  interval = "15m"; break;
                case "1mo": interval = "1h"; break;
                case "1y":  interval = "1d"; break;
                default:    interval = "1d"; break;
            }
        }

        // --- Fetch raw data ---
        String url = FASTAPI_BASE + "/ticker/" + symbol + "/history?period=" + period + "&interval=" + interval;
        List<Map<String, Object>> rawData = restTemplate.getForObject(url, List.class);
        if (rawData == null) return new ArrayList<>();

        ZoneId zone = ZoneId.of("Asia/Kolkata");
        LocalTime marketOpen = LocalTime.of(9, 15);
        LocalTime marketClose = LocalTime.of(15, 30);

        List<Map<String, Object>> history = rawData.stream()
            .map(entry -> {
                Map<String, Object> candle = new HashMap<>();
                // ✅ Correct ISO-8601 with IST offset
                candle.put("Datetime", entry.get("Datetime").toString().replace(" ", "T") + "+05:30");
                candle.put("Open", entry.get("Open"));
                candle.put("High", entry.get("High"));
                candle.put("Low", entry.get("Low"));
                candle.put("Close", entry.get("Close"));
                candle.put("Volume", entry.get("Volume"));
                return candle;
            })
            .filter(candle -> {
                try {
                    ZonedDateTime dt = ZonedDateTime.parse(candle.get("Datetime").toString());
                    DayOfWeek day = dt.getDayOfWeek();
                    LocalTime time = dt.toLocalTime();
                    return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY
                           && !time.isBefore(marketOpen) && !time.isAfter(marketClose);
                } catch (Exception e) {
                    return false;
                }
            })
            .sorted(Comparator.comparing(c -> ZonedDateTime.parse(c.get("Datetime").toString())))
            .collect(Collectors.toList());

        return history;

    } catch (Exception e) {
        System.err.println("❌ Failed to fetch history for " + symbol + ": " + e.getMessage());
        return new ArrayList<>();
    }
}
    
    

    public List<Map<String, Object>> getTrendingStocks() {
        List<Map<String, Object>> trending = new ArrayList<>();
        List<String> trendingSymbols = Arrays.asList("RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS");

        for (String symbol : trendingSymbols) {
            try {
                String url = FASTAPI_BASE + "/ticker/" + symbol + "/info";
                Map<String, Object> data = restTemplate.getForObject(url, Map.class);
                System.out.println("API Response for " + symbol + ": " + data);

                if (data != null) {
                    Map<String, Object> stock = new LinkedHashMap<>();
                    stock.put("symbol", symbol.replace(".NS", ""));
                    stock.put("name", data.getOrDefault("longName", symbol));
                    
                    Object priceObj = data.get("currentPrice");
                    double price = 0;
                    if (priceObj instanceof Number) {
                        price = ((Number) priceObj).doubleValue();
                    }
                    stock.put("price", price);

                    Object changeObj = data.getOrDefault("regularMarketChange", 0);
                    double change = 0;
                    if (changeObj instanceof Number) {
                        change = ((Number) changeObj).doubleValue();
                    }
                    stock.put("change", change);

                    trending.add(stock);
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch trending stock " + symbol + ": " + e.getMessage());
            }
        }
        return trending;
    }
    public Map<String, List<Map<String, Object>>> getTrendingSectors() {
        Map<String, List<Double>> sectorChanges = new HashMap<>();

        for (String symbol : SYMBOLS) {
            try {
                String url = FASTAPI_BASE + "/ticker/" + symbol + "/info";
                Map<String, Object> data = restTemplate.getForObject(url, Map.class);

                if (data != null && data.containsKey("currentPrice")) {
                    String sector = (String) data.getOrDefault("sector", "N/A");
                    Double change = ((Number) data.getOrDefault("regularMarketChangePercent", 0)).doubleValue();

                    sectorChanges.putIfAbsent(sector, new ArrayList<>());
                    sectorChanges.get(sector).add(change);
                }
            } catch (Exception e) {
                System.err.println("Failed to fetch stock " + symbol + ": " + e.getMessage());
            }
        }

        // Compute average change per sector
        List<Map<String, Object>> gaining = new ArrayList<>();
        List<Map<String, Object>> losing = new ArrayList<>();

        for (Map.Entry<String, List<Double>> entry : sectorChanges.entrySet()) {
            String sector = entry.getKey();
            List<Double> changes = entry.getValue();
            double avgChange = changes.stream().mapToDouble(Double::doubleValue).average().orElse(0);

            Map<String, Object> sectorData = new HashMap<>();
            sectorData.put("name", sector);
            sectorData.put("avgChange", avgChange);

            if (avgChange >= 0) {
                gaining.add(sectorData);
            } else {
                losing.add(sectorData);
            }
        }

        // Sort descending for gaining, ascending for losing
        gaining.sort((a, b) -> Double.compare((Double) b.get("avgChange"), (Double) a.get("avgChange")));
        losing.sort((a, b) -> Double.compare((Double) a.get("avgChange"), (Double) b.get("avgChange")));

        Map<String, List<Map<String, Object>>> result = new HashMap<>();
        result.put("gaining", gaining);
        result.put("losing", losing);

        return result;
    }

};