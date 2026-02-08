/**
 * Tag Related Type Definition
 */

/**
 * Workflow Tag
 */
export interface Tag {
 /** Tag ID */
 id: string;
 /** User ID */
 user_id: string;
 /** Tag Name */
 name: string;
 /** Tag Color */
 color: string;
 /** Created At */
 created_at: string;
}

/**
 * Tag with Usage Count
 */
export interface TagWithCount extends Tag {
 /** Usage Count */
 count: number;
}

/**
 * Tag for Frontend Display
 */
export interface WorkflowTag {
 id: string;
 name: string;
 color: string;
 count: number;
}
