package com.stocksim.backend.repositories;

import com.stocksim.backend.model.Order;
import com.stocksim.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user); // fetch all orders for a user
}