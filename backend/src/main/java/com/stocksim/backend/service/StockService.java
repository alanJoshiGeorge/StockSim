package com.stocksim.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

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
        // Build the external API URL
        String url = FASTAPI_BASE + "/ticker/" + symbol + "/history?period=" + period + "&interval=" + interval;
        List<Map<String, Object>> rawData = restTemplate.getForObject(url, List.class);

        if (rawData == null || rawData.isEmpty()) {
            System.out.println("⚠️ No data received from external API for " + symbol);
            return new ArrayList<>();
        }

        // Convert timestamps to ISO-8601 and map required fields
        List<Map<String, Object>> history = rawData.stream()
            .map(entry -> {
                Map<String, Object> candle = new HashMap<>();
                try {
                    String rawTime = entry.get("Datetime").toString().trim();
                    // Convert "2025-10-17 10:30:00" → "2025-10-17T10:30:00"
                    String formattedTime = rawTime.replace(" ", "T");

                    candle.put("Datetime", formattedTime);
                    candle.put("Open", entry.get("Open"));
                    candle.put("High", entry.get("High"));
                    candle.put("Low", entry.get("Low"));
                    candle.put("Close", entry.get("Close"));
                    candle.put("Volume", entry.get("Volume"));
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to process entry: " + e.getMessage());
                }
                return candle;
            })
            .filter(candle -> candle.get("Datetime") != null) 
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



public List<Map<String, Object>> getIndianIndices() {
    // Map of ticker -> display name
    Map<String, String> indices = new LinkedHashMap<>();
    indices.put("^NSEI", "Nifty 50");
    indices.put("^CNXIT", "Nifty IT");
    indices.put("^NSEBANK", "Nifty Bank");
    indices.put("^BSESN", "Sensex");

    List<Map<String, Object>> result = new ArrayList<>();

    for (Map.Entry<String, String> entry : indices.entrySet()) {
        String ticker = entry.getKey();
        String displayName = entry.getValue();

        try {
            String url = FASTAPI_BASE + "/ticker/" + ticker + "/info";
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            System.out.println("API Response for index " + ticker + ": " + data);

            if (data != null) {
                Map<String, Object> index = new LinkedHashMap<>();
                index.put("name", displayName); // friendly name for frontend
                
                Object valueObj = data.get("currentPrice"); // Yahoo Finance field for current index value
                double value = 0;
                if (valueObj instanceof Number) {
                    value = ((Number) valueObj).doubleValue();
                }
                index.put("value", value);

                Object changeObj = data.getOrDefault("regularMarketChangePercent", 0);
                double change = 0;
                if (changeObj instanceof Number) {
                    change = ((Number) changeObj).doubleValue();
                }
                index.put("change", change);

                result.add(index);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch index " + ticker + ": " + e.getMessage());
        }
    }

    return result;
}
    public List<Map<String, Object>> getMarketOverview() {
    Map<String, String> indices = new LinkedHashMap<>();
    indices.put("^GSPC", "S&P 500"); 
    indices.put("^IXIC", "NASDAQ");  
    indices.put("^DJI", "DOW");      

    List<Map<String, Object>> result = new ArrayList<>();

    for (Map.Entry<String, String> entry : indices.entrySet()) {
        String ticker = entry.getKey();
        String displayName = entry.getValue();

        try {
            String url = FASTAPI_BASE + "/ticker/" + ticker + "/info";
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);

            if (data != null) {
                Map<String, Object> index = new LinkedHashMap<>();
                index.put("name", displayName);

                Object valueObj = data.get("currentPrice");
                double value = 0;
                if (valueObj instanceof Number) {
                    value = ((Number) valueObj).doubleValue();
                }
                index.put("value", value);

                Object changeObj = data.getOrDefault("regularMarketChangePercent", 0);
                double change = 0;
                if (changeObj instanceof Number) {
                    change = ((Number) changeObj).doubleValue();
                }
                index.put("change", change);

                result.add(index);
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch index " + ticker + ": " + e.getMessage());
        }
    }

    return result;
}


}