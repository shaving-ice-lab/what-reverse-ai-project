/**
 * Sign InDeviceRelatedTypeDefinition
 */

/**
 * Sign InDevice
 */
export interface LoginDevice {
 /** Device/will ID */
 id: string;
 /** DeviceType: desktop, mobile, tablet */
 type: "desktop" | "mobile" | "tablet";
 /** DeviceName */
 name: string;
 /** Browse */
 browser: string;
 /** */
 location: string;
 /** IP Address (PartialHide) */
 ip: string;
 /** isnoasCurrentDevice */
 is_current: boolean;
 /** mostafterActivityTime */
 last_active: string;
}

/**
 * Format'sDeviceInfo(Used forbeforeendpointDisplay)
 */
export interface FormattedDevice extends LoginDevice {
 lastActiveFormatted: string;
}
