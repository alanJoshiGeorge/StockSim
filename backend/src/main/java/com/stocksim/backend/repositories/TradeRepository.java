package com.stocksim.backend.repositories;

import com.stocksim.backend.model.Trade;
import com.stocksim.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TradeRepository extends JpaRepository<Trade, Long> {

    // Fetch all trades for a specific user
    List<Trade> findByUser(User user);

    // Fetch all trades for a specific user and stock symbol
    List<Trade> findByUserAndStockSymbol(User user, String stockSymbol);

    // Get the net quantity held for a stock (BUY minus SELL)
    @Query("SELECT SUM(CASE WHEN t.tradeType='BUY' THEN t.quantity ELSE -t.quantity END) " +
           "FROM Trade t WHERE t.user.id = :userId AND t.stockSymbol = :symbol")
    Integer getNetQuantity(@Param("userId") Long userId, @Param("symbol") String symbol);
}
