/**
 * UserActivityRelatedTypeDefinition
 */

/**
 * UserActivityRecord
 */
export interface UserActivity {
 /** Activity ID */
 id: string;
 /** ActionType */
 action: string;
 /** RelatedEntityType */
 entity_type?: string;
 /** RelatedEntity ID */
 entity_id?: string;
 /** DeviceInfo */
 device?: string;
 /** IP Address */
 ip?: string;
 /** */
 location?: string;
 /** Created At */
 created_at: string;
}

/**
 * Format'sActivityRecord(Used forbeforeendpointDisplay)
 */
export interface FormattedActivity {
 id: string;
 action: string;
 target?: string;
 device: string;
 time: string;
}
