package com.stocksim.backend.repositories;

import com.stocksim.backend.model.Watchlist;
import com.stocksim.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {

    Optional<Watchlist> findByUserAndStockSymbol(User user, String stockSymbol);

    List<Watchlist> findAllByUser(User user);

    @Modifying
    @Transactional
    void deleteByUserAndStockSymbol(User user, String stockSymbol);
}