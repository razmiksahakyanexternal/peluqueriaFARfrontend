package org.peluqueriaFAR.peluqueriaFAR.repository;

import org.peluqueriaFAR.peluqueriaFAR.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.peluqueriaFAR.peluqueriaFAR.model.Role;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findFirstByRoleAndActiveTrueOrderByIdAsc(Role role);

    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.name) LIKE LOWER(CONCAT(:query, '%'))
               OR LOWER(u.surname) LIKE LOWER(CONCAT(:query, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT(:query, '%'))
            """)
    List<User> searchBySurname(@Param("query") String query);
}
