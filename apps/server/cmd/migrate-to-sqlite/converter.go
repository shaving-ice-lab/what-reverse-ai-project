package main

import (
	"regexp"
	"strings"
)

// convertDDL converts a MySQL CREATE TABLE statement to SQLite-compatible DDL.
func convertDDL(mysqlDDL string) string {
	result := mysqlDDL

	// 1. Remove ENGINE/CHARSET/COLLATE clauses at the end
	result = regexp.MustCompile(`(?i)\)\s*ENGINE\s*=.*$`).ReplaceAllString(result, ")")

	// 2. AUTO_INCREMENT → AUTOINCREMENT
	result = regexp.MustCompile(`(?i)\bAUTO_INCREMENT\b`).ReplaceAllString(result, "AUTOINCREMENT")

	// 3. Remove table-level AUTO_INCREMENT=N
	result = regexp.MustCompile(`(?i)\bAUTOINCREMENT\s*=\s*\d+`).ReplaceAllString(result, "")

	// 4. INT types → INTEGER
	result = regexp.MustCompile(`(?i)\bBIGINT\s*(\(\d+\))?\s*(UNSIGNED)?`).ReplaceAllString(result, "INTEGER")
	result = regexp.MustCompile(`(?i)\bMEDIUMINT\s*(\(\d+\))?\s*(UNSIGNED)?`).ReplaceAllString(result, "INTEGER")
	result = regexp.MustCompile(`(?i)\bSMALLINT\s*(\(\d+\))?\s*(UNSIGNED)?`).ReplaceAllString(result, "INTEGER")
	result = regexp.MustCompile(`(?i)\bTINYINT\s*\(\d+\)\s*(UNSIGNED)?`).ReplaceAllString(result, "INTEGER")
	result = regexp.MustCompile(`(?i)\bTINYINT\b\s*(UNSIGNED)?`).ReplaceAllString(result, "INTEGER")
	result = regexp.MustCompile(`(?i)\bINT\s*\(\d+\)\s*(UNSIGNED)?`).ReplaceAllString(result, "INTEGER")
	// Avoid matching INTEGER that we just placed
	result = regexp.MustCompile(`(?i)\bINT\b\s+(UNSIGNED)`).ReplaceAllString(result, "INTEGER")

	// 5. VARCHAR(n) → TEXT
	result = regexp.MustCompile(`(?i)VARCHAR\s*\(\d+\)`).ReplaceAllString(result, "TEXT")

	// 6. LONGTEXT / MEDIUMTEXT / TINYTEXT → TEXT
	result = regexp.MustCompile(`(?i)\bLONGTEXT\b`).ReplaceAllString(result, "TEXT")
	result = regexp.MustCompile(`(?i)\bMEDIUMTEXT\b`).ReplaceAllString(result, "TEXT")
	result = regexp.MustCompile(`(?i)\bTINYTEXT\b`).ReplaceAllString(result, "TEXT")

	// 7. DECIMAL(m,n) / FLOAT / DOUBLE → REAL
	result = regexp.MustCompile(`(?i)DECIMAL\s*\(\d+\s*,\s*\d+\)`).ReplaceAllString(result, "REAL")
	result = regexp.MustCompile(`(?i)DECIMAL\s*\(\d+\)`).ReplaceAllString(result, "REAL")
	result = regexp.MustCompile(`(?i)\bFLOAT\b`).ReplaceAllString(result, "REAL")
	result = regexp.MustCompile(`(?i)\bDOUBLE\b`).ReplaceAllString(result, "REAL")

	// 8. DATETIME / TIMESTAMP / DATE → TEXT
	result = regexp.MustCompile(`(?i)\bDATETIME\b`).ReplaceAllString(result, "TEXT")
	result = regexp.MustCompile(`(?i)\bTIMESTAMP\b`).ReplaceAllString(result, "TEXT")
	// Be careful not to replace DATE inside DATETIME (already replaced)
	result = regexp.MustCompile(`(?i)\bDATE\b`).ReplaceAllString(result, "TEXT")

	// 9. CURRENT_TIMESTAMP → datetime('now')
	result = regexp.MustCompile(`(?i)DEFAULT\s+CURRENT_TIMESTAMP`).ReplaceAllString(result, "DEFAULT (datetime('now'))")

	// 10. ON UPDATE CURRENT_TIMESTAMP → remove
	result = regexp.MustCompile(`(?i)\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b`).ReplaceAllString(result, "")

	// 11. ENUM('a','b','c') → TEXT CHECK(col IN ('a','b','c'))
	result = convertEnumToCheck(result)

	// 12. JSON → TEXT
	result = regexp.MustCompile(`(?i)\bJSON\b`).ReplaceAllString(result, "TEXT")

	// 13. Remove COMMENT '...' on columns
	result = regexp.MustCompile(`(?i)\s+COMMENT\s+'[^']*'`).ReplaceAllString(result, "")

	// 14. Remove CHARACTER SET / COLLATE on columns
	result = regexp.MustCompile(`(?i)\s+CHARACTER\s+SET\s+\w+`).ReplaceAllString(result, "")
	result = regexp.MustCompile(`(?i)\s+COLLATE\s+\w+`).ReplaceAllString(result, "")

	// 15. Remove MySQL KEY/INDEX definitions (we extract indexes separately)
	result = removeMySQLKeyDefinitions(result)

	// 16. UNIQUE KEY name (col) → UNIQUE(col)
	result = convertUniqueKeys(result)

	// 17. Clean up trailing commas before closing paren
	result = cleanTrailingCommas(result)

	return result
}

// convertEnumToCheck converts MySQL ENUM('a','b') to TEXT CHECK(col IN ('a','b'))
func convertEnumToCheck(ddl string) string {
	re := regexp.MustCompile(`(?i)(\w+)\s+ENUM\s*\(([^)]+)\)`)
	return re.ReplaceAllStringFunc(ddl, func(match string) string {
		sub := re.FindStringSubmatch(match)
		if len(sub) < 3 {
			return match
		}
		colName := sub[1]
		enumValues := sub[2]
		return colName + " TEXT CHECK(" + colName + " IN (" + enumValues + "))"
	})
}

// removeMySQLKeyDefinitions removes KEY/INDEX lines from CREATE TABLE body
func removeMySQLKeyDefinitions(ddl string) string {
	// Remove lines like:  KEY `idx_name` (`col1`, `col2`),
	// But NOT UNIQUE KEY or PRIMARY KEY
	re := regexp.MustCompile(`(?im)^\s*,?\s*KEY\s+` + "`[^`]+`" + `\s*\([^)]+\)\s*,?\s*$`)
	result := re.ReplaceAllString(ddl, "")

	// Also remove standalone INDEX lines
	re2 := regexp.MustCompile(`(?im)^\s*,?\s*INDEX\s+` + "`[^`]+`" + `\s*\([^)]+\)\s*,?\s*$`)
	result = re2.ReplaceAllString(result, "")

	return result
}

// convertUniqueKeys converts UNIQUE KEY `name` (`col`) → UNIQUE(`col`)
func convertUniqueKeys(ddl string) string {
	re := regexp.MustCompile("(?im)UNIQUE\\s+KEY\\s+`[^`]+`\\s*\\(([^)]+)\\)")
	return re.ReplaceAllString(ddl, "UNIQUE($1)")
}

// cleanTrailingCommas removes trailing commas before closing parenthesis
func cleanTrailingCommas(ddl string) string {
	// Remove ,\s*) patterns
	re := regexp.MustCompile(`,\s*\)`)
	return re.ReplaceAllString(ddl, "\n)")
}

// extractIndexes extracts CREATE INDEX statements from MySQL DDL
// Returns separate CREATE INDEX SQL statements for SQLite
func extractIndexes(tableName string, mysqlDDL string) []string {
	var indexes []string

	// Match KEY `idx_name` (`col1`, `col2`)
	re := regexp.MustCompile("(?i)KEY\\s+`([^`]+)`\\s*\\(([^)]+)\\)")
	matches := re.FindAllStringSubmatch(mysqlDDL, -1)

	for _, m := range matches {
		if len(m) < 3 {
			continue
		}
		idxName := m[1]
		cols := m[2]
		// Clean backticks from column names
		cols = strings.ReplaceAll(cols, "`", "")
		cols = strings.TrimSpace(cols)

		// Skip if it's a UNIQUE KEY (handled inline) or PRIMARY KEY
		lineIdx := strings.Index(mysqlDDL, m[0])
		if lineIdx > 0 {
			prefix := mysqlDDL[max(0, lineIdx-20):lineIdx]
			if strings.Contains(strings.ToUpper(prefix), "UNIQUE") || strings.Contains(strings.ToUpper(prefix), "PRIMARY") {
				continue
			}
		}

		indexes = append(indexes, "CREATE INDEX IF NOT EXISTS "+idxName+" ON "+tableName+"("+cols+")")
	}

	return indexes
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
