CREATE TABLE IF NOT EXISTS what_reverse_sboms (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(200) NOT NULL,
  format VARCHAR(30) NOT NULL,
  version VARCHAR(30) NULL,
  source VARCHAR(50) NULL,
  digest VARCHAR(64) NULL,
  content_json JSON NOT NULL,
  metadata_json JSON NULL,
  generated_at TIMESTAMP NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sboms_workspace (workspace_id),
  INDEX idx_sboms_artifact (artifact_type, artifact_id),
  INDEX idx_sboms_created (created_at)
);

CREATE TABLE IF NOT EXISTS what_reverse_artifact_signatures (
  id CHAR(36) PRIMARY KEY,
  workspace_id CHAR(36) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  artifact_id VARCHAR(200) NOT NULL,
  digest VARCHAR(64) NOT NULL,
  algorithm VARCHAR(30) NOT NULL,
  signature LONGTEXT NOT NULL,
  signer VARCHAR(120) NULL,
  certificate LONGTEXT NULL,
  verified TINYINT(1) DEFAULT 0,
  verified_at TIMESTAMP NULL,
  verification_metadata_json JSON NULL,
  source VARCHAR(50) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_signatures_workspace (workspace_id),
  INDEX idx_signatures_artifact (artifact_type, artifact_id),
  INDEX idx_signatures_verified (verified, verified_at)
);
