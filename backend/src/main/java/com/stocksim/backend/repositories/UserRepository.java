package com.stocksim.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.stocksim.backend.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
}
