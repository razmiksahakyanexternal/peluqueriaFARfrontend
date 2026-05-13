package org.peluqueriaFAR.peluqueriaFAR.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseCompatibilityRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        removeLegacyWorkingDaysConfigColumn();
    }

    private void removeLegacyWorkingDaysConfigColumn() {
        Integer columnCount = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = database()
                  and table_name = 'barber_working_days'
                  and column_name = 'config_id'
                """, Integer.class);

        if (columnCount == null || columnCount == 0) {
            return;
        }

        List<String> foreignKeys = jdbcTemplate.queryForList("""
                select constraint_name
                from information_schema.key_column_usage
                where table_schema = database()
                  and table_name = 'barber_working_days'
                  and column_name = 'config_id'
                  and referenced_table_name is not null
                """, String.class);

        for (String foreignKey : foreignKeys) {
            jdbcTemplate.execute("alter table barber_working_days drop foreign key `" + foreignKey + "`");
        }

        jdbcTemplate.execute("alter table barber_working_days drop column config_id");
        log.info("Removed legacy barber_working_days.config_id column");
    }
}
